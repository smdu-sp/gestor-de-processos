import type { Prisma } from "@prisma/client";
import type { Actor } from "./auth";
export const roles = ["CONSULTA", "TECNICO", "GESTOR", "ADMIN"] as const;
export const roleLabels: Record<string, string> = {
  CONSULTA: "Consulta",
  TECNICO: "Técnico",
  GESTOR: "Gestor",
  ADMIN: "Administrador",
};
export const loginPattern = /^[a-z]\d{6}$/;
export type LdapPerson = { login: string; name: string; email: string };
// Busca no LDAP via API SMUL Auth (mesmo serviço usado no login).
export async function lookupLdap(login: string): Promise<LdapPerson | null> {
  const base = process.env.SMUL_AUTH_API_URL?.replace(/\/+$/, "");
  if (!base)
    throw new Error("Serviço LDAP (SMUL_AUTH_API_URL) não configurado.");
  let response: Response;
  try {
    response = await fetch(
      `${base}/auth/ldap/buscar-por-login/${encodeURIComponent(login)}?secretarias=SMUL`,
      { cache: "no-store", signal: AbortSignal.timeout(10000) },
    );
  } catch {
    throw new Error("Serviço LDAP indisponível.");
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Serviço LDAP indisponível.");
  const data = await response.json().catch(() => null);
  if (typeof data?.nome !== "string" || !data.nome.trim()) return null;
  return {
    login,
    name: data.nome.trim(),
    email: typeof data.email === "string" ? data.email.toLowerCase() : "",
  };
}
// As unidades de acesso derivam da lotação: gestor enxerga a coordenadoria
// inteira; administrador, todas; demais perfis, somente a própria divisão.
export async function syncAccess(tx: Prisma.TransactionClient, userId: string) {
  const user = await tx.user.findUniqueOrThrow({
    where: { id: userId },
    include: { unit: true },
  });
  const units =
    user.role === "ADMIN"
      ? await tx.unit.findMany()
      : user.role === "GESTOR" && user.unit
        ? await tx.unit.findMany({
            where: { coordinationId: user.unit.coordinationId },
          })
        : user.unit
          ? [user.unit]
          : [];
  await tx.membership.deleteMany({ where: { userId } });
  await tx.membership.createMany({
    data: units.map((u) => ({ userId, unitId: u.id })),
  });
}
// Gestor administra servidores das divisões que acessa, sem conceder ADMIN.
export function assertCanManageStaff(
  actor: Actor,
  target: { role: string; unitId: string | null } | null,
  next: { role: string; unitId: string },
) {
  if (actor.role === "ADMIN") return;
  if (actor.role !== "GESTOR") throw new Error("Acesso restrito à gestão.");
  const allowed = new Set(actor.memberships.map((m) => m.unitId));
  if (next.role === "ADMIN" || target?.role === "ADMIN")
    throw new Error("Somente administradores gerenciam administradores.");
  if (
    !allowed.has(next.unitId) ||
    (target?.unitId && !allowed.has(target.unitId))
  )
    throw new Error("Divisão fora da sua coordenadoria.");
}
