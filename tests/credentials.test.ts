import { test } from "node:test";
import assert from "node:assert/strict";
import { hash } from "bcryptjs";
import type { Prisma, User } from "@prisma/client";
import { authenticateCredentials as authenticate } from "../src/lib/credentials";

test("autenticação local e LDAP preserva bloqueios e cadastro pendente", async (t) => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalMode = process.env.AUTH_MODE;
  const originalUrl = process.env.SMUL_AUTH_API_URL;
  const user = {
    id: "u1",
    rf: "d000001",
    name: "Local",
    email: null,
    unitId: null,
    active: true,
    role: "CONSULTA",
    passwordHash: await hash("senha-correta", 4),
  };
  const users = {
    findUnique: async (
      _args: Prisma.UserFindUniqueArgs,
    ): Promise<User | null> => user,
    update: async (_args: Prisma.UserUpdateArgs) => user,
    upsert: async (_args: Prisma.UserUpsertArgs) => user,
  };
  const authenticateCredentials = (login: string, senha: string) =>
    authenticate(login, senha, users);
  const find = t.mock.method(users, "findUnique");
  const update = t.mock.method(users, "update", async () => ({
    ...user,
    name: "Rede",
  }));
  const upsert = t.mock.method(users, "upsert", async () => ({
    ...user,
    active: false,
  }));
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ nome: "Rede" }),
  );
  try {
    Object.assign(process.env, { NODE_ENV: "production" });
    process.env.AUTH_MODE = "local";
    assert.equal(
      (await authenticateCredentials(user.rf, "senha-correta"))?.id,
      user.id,
    );
    assert.equal(await authenticateCredentials(user.rf, "incorreta"), null);
    assert.equal(fetchMock.mock.callCount(), 0);
    Object.assign(process.env, { NODE_ENV: "development" });
    assert.equal((await authenticateCredentials(user.rf, ""))?.id, user.id);
    assert.equal(
      (await authenticateCredentials(user.rf, "qualquer"))?.id,
      user.id,
    );
    find.mock.mockImplementation(async () => ({ ...user, active: false }));
    assert.equal(await authenticateCredentials(user.rf, ""), null);
    find.mock.mockImplementation(async () => null);
    assert.equal(await authenticateCredentials(user.rf, ""), null);
    find.mock.mockImplementation(async () => user);
    process.env.AUTH_MODE = "ldap";
    process.env.SMUL_AUTH_API_URL = "https://auth.example.test/";
    assert.equal(
      (await authenticateCredentials(user.rf, "rede"))?.name,
      "Rede",
    );
    assert.equal(update.mock.callCount(), 1);
    assert.equal(
      fetchMock.mock.calls[0].arguments[0],
      "https://auth.example.test/auth/ldap/autenticar",
    );
    find.mock.mockImplementation(async () => ({ ...user, active: false }));
    assert.equal(await authenticateCredentials(user.rf, "rede"), null);
    assert.equal(fetchMock.mock.callCount(), 1);
    find.mock.mockImplementation(async () => null);
    assert.equal(await authenticateCredentials(user.rf, "rede"), null);
    assert.equal(upsert.mock.callCount(), 1);
    const create = upsert.mock.calls[0].arguments[0]?.create;
    assert.ok(create);
    assert.equal(create.active, false);
    assert.equal(create.role, "CONSULTA");
    assert.equal(create.passwordHash, "");
    find.mock.mockImplementation(async () => user);
    fetchMock.mock.mockImplementation(
      async () => new Response(null, { status: 401 }),
    );
    assert.equal(await authenticateCredentials(user.rf, "senha-correta"), null);
    fetchMock.mock.mockImplementation(async () => {
      throw new Error("offline");
    });
    await assert.rejects(
      authenticateCredentials(user.rf, "senha-correta"),
      /indisponível/,
    );
    delete process.env.SMUL_AUTH_API_URL;
    await assert.rejects(
      authenticateCredentials(user.rf, "senha-correta"),
      /não configurado/,
    );
  } finally {
    if (originalNodeEnv === undefined)
      Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.assign(process.env, { NODE_ENV: originalNodeEnv });
    if (originalMode === undefined) delete process.env.AUTH_MODE;
    else process.env.AUTH_MODE = originalMode;
    if (originalUrl === undefined) delete process.env.SMUL_AUTH_API_URL;
    else process.env.SMUL_AUTH_API_URL = originalUrl;
  }
});
