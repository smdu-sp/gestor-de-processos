import { compare } from "bcryptjs";
import { db } from "./db";
import type { Prisma, User } from "@prisma/client";
import { authMode, passwordlessDevelopment } from "./auth-mode";
type UserStore = {
  findUnique(args: Prisma.UserFindUniqueArgs): PromiseLike<User | null>;
  update(args: Prisma.UserUpdateArgs): PromiseLike<User>;
  upsert(args: Prisma.UserUpsertArgs): PromiseLike<User>;
};

export async function authenticateCredentials(
  login: string,
  senha: string,
  users: UserStore = db.user,
) {
  const user = await users.findUnique({ where: { rf: login } });
  if (user && !user.active) return null;
  const mode = authMode();
  if (mode === "local") {
    if (passwordlessDevelopment()) return user;
    return user && (await compare(senha, user.passwordHash)) ? user : null;
  }
  if (mode !== "ldap") throw new Error("Modo de autenticação inválido.");
  const base = process.env.SMUL_AUTH_API_URL?.replace(/\/+$/, "");
  if (!base) throw new Error("Serviço de autenticação não configurado.");
  let response: Response;
  try {
    response = await fetch(`${base}/auth/ldap/autenticar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, senha }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error("Serviço de autenticação indisponível.");
  }
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Serviço de autenticação indisponível.");
  const data = await response.json();
  if (typeof data?.nome !== "string" || !data.nome.trim()) return null;
  if (!user) {
    // O cadastro de rede precisa ser liberado e vinculado às unidades por um administrador.
    await users.upsert({
      where: { rf: login },
      update: {},
      create: {
        rf: login,
        name: data.nome,
        passwordHash: "",
        active: false,
        role: "CONSULTA",
      },
    });
    return null;
  }
  const updated = await users.update({
    where: { id: user.id },
    data: { name: data.nome },
  });
  return updated.active ? updated : null;
}
