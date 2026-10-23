import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
export const SESSION_COOKIE = "gestao-processos.session-token";
export const hashToken = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: { include: { memberships: { include: { unit: true } } } },
    },
  });
  return session && session.expiresAt > new Date() && session.user.active
    ? session.user
    : null;
}
export async function openSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 3600000);
  await db.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}
export type Actor = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
export const unitScope = (u: Actor) =>
  u.role === "ADMIN"
    ? {}
    : { unitId: { in: u.memberships.map((m) => m.unitId) } };
export const canManage = (u: { role: string }) =>
  ["ADMIN", "GESTOR"].includes(u.role);
export function assertUnit(u: Actor, unitId: string) {
  if (u.role !== "ADMIN" && !u.memberships.some((m) => m.unitId === unitId))
    throw new Error("Acesso à unidade não autorizado.");
}
