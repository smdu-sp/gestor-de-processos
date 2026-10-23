import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import "dotenv/config";
import { randomBytes } from "node:crypto";
test("fluxos transacionais, isolamento, redistribuição e sincronização idempotente", async () => {
  const database = `gestao_test_${randomBytes(8).toString("hex")}`;
  const connection = new URL(process.env.DATABASE_URL!);
  if (
    connection.protocol !== "mysql:" ||
    !["127.0.0.1", "localhost"].includes(connection.hostname)
  )
    throw new Error("Testes requerem MySQL Docker local.");
  const user = decodeURIComponent(connection.username);
  if (!/^[a-zA-Z0-9_]+$/.test(user))
    throw new Error("Usuário de teste inválido.");
  function adminSql(sql: string) {
    execFileSync(
      "docker",
      [
        "compose",
        "exec",
        "-T",
        "mysql",
        "sh",
        "-c",
        'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot',
      ],
      { input: sql, stdio: ["pipe", "pipe", "pipe"] },
    );
  }
  adminSql(
    `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL ON \`${database}\`.* TO '${user}'@'%';`,
  );
  connection.pathname = `/${database}`;
  process.env.DATABASE_URL = connection.toString();
  execFileSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { env: process.env, stdio: "pipe" },
  );
  const { db } = await import("../src/lib/db");
  const { operate } = await import("../src/lib/operations");
  const { synchronize } = await import("../src/lib/integrations");
  const { processFilter } = await import("../src/lib/queries");
  try {
    const coordination = await db.coordination.create({
      data: { code: "C", name: "Coordenadoria C" },
    });
    const a = await db.unit.create({
      data: { code: "A", name: "Unidade A", coordinationId: coordination.id },
    });
    const b = await db.unit.create({
      data: { code: "B", name: "Unidade B", coordinationId: coordination.id },
    });
    const admin = await db.user.create({
      data: {
        rf: "admin",
        name: "Gestor",
        role: "ADMIN",
        passwordHash: "test",
      },
      include: { memberships: { include: { unit: true } } },
    });
    const tech = await db.user.create({
      data: {
        rf: "tech",
        name: "Técnica",
        role: "TECNICO",
        passwordHash: "test",
        memberships: { create: { unitId: a.id } },
      },
      include: { memberships: { include: { unit: true } } },
    });
    const other = await db.user.create({
      data: {
        rf: "other",
        name: "Outro",
        role: "TECNICO",
        passwordHash: "test",
        memberships: { create: { unitId: b.id } },
      },
      include: { memberships: { include: { unit: true } } },
    });
    const p = await db.process.create({
      data: {
        number: "6068.2026/1234567-0",
        subject: "Cadastro manual",
        unitId: a.id,
        notes: "Preservar",
        priority: true,
      },
    });
    await operate(admin, p.id, {
      action: "assign",
      version: 0,
      userId: tech.id,
      unitId: a.id,
      reason: "Primeira distribuição",
    });
    await assert.rejects(
      operate(admin, p.id, {
        action: "status",
        version: 0,
        status: "Em análise",
        reason: "Versão antiga",
      }),
      /alterado por outro/,
    );
    assert.equal(
      (await db.process.findUniqueOrThrow({ where: { id: p.id } })).version,
      1,
    );
    await operate(tech, p.id, {
      action: "activity",
      version: 1,
      type: "Análise",
      description: "Trabalho registrado",
      category: "TECNICA",
      startedAt: "2026-01-01T12:00:00Z",
      endedAt: "2026-01-02T12:00:00Z",
    });
    await assert.rejects(
      operate(other, p.id, {
        action: "activity",
        version: 2,
        type: "Análise",
        description: "Não autorizado",
        category: "TECNICA",
        startedAt: "2026-01-01T12:00:00Z",
      }),
      /não autorizado/,
    );
    await operate(admin, p.id, {
      action: "assign",
      version: 2,
      userId: other.id,
      unitId: b.id,
      reason: "Transferência",
    });
    const activity = await db.activity.findFirstOrThrow();
    assert.equal(activity.userId, tech.id);
    assert.equal(activity.unitId, a.id);
    assert.equal(
      await db.assignment.count({ where: { processId: p.id, endedAt: null } }),
      1,
    );
    assert.equal(await db.assignment.count({ where: { processId: p.id } }), 2);
    assert.equal(await db.process.count({ where: processFilter(tech, {}) }), 0);
    const bi = {
      complete: true,
      processes: [
        {
          id: "bi-1",
          number: p.number,
          subject: "BI atualizado",
          unitCode: "A",
          properties: [{ identifier: "sql-secundario", address: "Rua A" }],
          parties: [{ name: "Interessado BI", role: "Requerente" }],
        },
      ],
    };
    await synchronize("BI", bi);
    await synchronize("BI", bi);
    const synced = await db.process.findUniqueOrThrow({ where: { id: p.id } });
    assert.equal(synced.notes, "Preservar");
    assert.equal(synced.priority, true);
    assert.equal(synced.unitId, b.id);
    assert.equal(synced.version, 3);
    assert.equal(await db.process.count(), 1);
    assert.equal(
      await db.process.count({
        where: processFilter(admin, { q: "sql-secundario" }),
      }),
      1,
    );
    await synchronize("SEI", {
      processes: [
        {
          number: p.number,
          status: "Em tramitação",
          events: [
            {
              id: "evt1",
              description: "Recebido na unidade",
              occurredAt: "2026-01-02T12:00:00Z",
            },
          ],
        },
      ],
    });
    const sei = {
      processes: [
        {
          number: p.number,
          status: "Em tramitação",
          events: [
            {
              id: "evt1",
              description: "Recebido na unidade",
              occurredAt: "2026-01-02T12:00:00Z",
            },
          ],
        },
      ],
    };
    await synchronize("SEI", sei);
    assert.equal(
      await db.history.count({
        where: { origin: "SEI", kind: "Movimentação SEI" },
      }),
      1,
    );
    assert.equal(await db.activity.count(), 1);
    await assert.rejects(
      synchronize("BI", {
        complete: true,
        processes: [
          { ...bi.processes[0], subject: "Deve reverter" },
          {
            id: "bad",
            number: "999",
            subject: "Inválido",
            unitCode: "INEXISTENTE",
          },
        ],
      }),
      /não mapeada/,
    );
    assert.equal(
      (await db.process.findUniqueOrThrow({ where: { id: p.id } })).subject,
      "BI atualizado",
    );
    await synchronize("BI", { complete: true, processes: [] });
    const missing = await db.process.findUniqueOrThrow({ where: { id: p.id } });
    assert.equal(missing.sourceMissing, true);
    assert.equal(missing.closedAt, null);
    await operate(admin, p.id, {
      action: "close",
      version: 3,
      reason: "Concluído",
    });
    await operate(admin, p.id, {
      action: "reopen",
      version: 4,
      reason: "Novo acompanhamento",
    });
    assert.equal(
      (await db.process.findUniqueOrThrow({ where: { id: p.id } })).closedAt,
      null,
    );
    assert.equal(
      await db.history.count({
        where: { processId: p.id, kind: { in: ["close", "reopen"] } },
      }),
      2,
    );
  } finally {
    await db.$disconnect();
    if (!/^gestao_test_[a-f0-9]{16}$/.test(database))
      throw new Error("Nome de banco temporário inválido.");
    adminSql(`DROP DATABASE \`${database}\`;`);
  }
});
