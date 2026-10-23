// Importa para testes os processos extraídos da planilha SERVIN (JSON gerado a partir do .xlsx).
// Uso: npx tsx scripts/import-planilha.ts <processos.json>
// Idempotente: processos cujo número já existe são ignorados.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { syncAccess } from "../src/lib/staff";
type Row = {
  number: string;
  protocol: string | null;
  system: string;
  unit: string;
  subject: string;
  status: string;
  decision: string | null;
  instance: string;
  priority: boolean;
  priorityReason: string | null;
  notes: string;
  closed: boolean;
  technician: string | null;
  assignedAt: string | null;
  filedAt: string | null;
  lastAt: string | null;
  properties: { identifier: string; address: string }[];
  parties: string[];
};
const ORIGIN = "PLANILHA";
const db = new PrismaClient();
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
function splitProperties(properties: Row["properties"]) {
  const byId = new Map<
    string,
    Row["properties"][number] & { origin: string }
  >();
  for (const p of properties) {
    const ids = p.identifier
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const id of ids.length ? ids : [""]) {
      const identifier = id.slice(0, 191);
      if (!byId.has(identifier))
        byId.set(identifier, {
          identifier,
          address: p.address,
          origin: ORIGIN,
        });
    }
  }
  return [...byId.values()];
}
async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Informe o caminho do JSON extraído.");
  const rows: Row[] = JSON.parse(readFileSync(file, "utf8"));
  const units = new Map(
    (await db.unit.findMany()).map((u) => [u.code, u.id] as const),
  );
  // A antiga unidade SERVIN é hoje o gabinete (SERVIN-G) da coordenadoria.
  const unitOf = (code: string) =>
    units.get(code === "SERVIN" ? "SERVIN-G" : code)!;
  const admin = await db.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const group = await db.group.upsert({
    where: { name: "Importação planilha (testes)" },
    update: {},
    create: { name: "Importação planilha (testes)" },
  });
  // Técnicos da planilha viram usuários TECNICO sem senha utilizável.
  const technicians = new Map<string, string>();
  for (const name of new Set(rows.flatMap((r) => r.technician ?? []))) {
    const rf = `tec-${slug(name)}`;
    // Lotação: divisão em que o técnico tem mais processos na planilha.
    const counts = new Map<string, number>();
    for (const r of rows.filter((r) => r.technician === name))
      counts.set(r.unit, (counts.get(r.unit) ?? 0) + 1);
    const unitId = unitOf([...counts].sort((a, b) => b[1] - a[1])[0][0]);
    const u = await db.user.upsert({
      where: { rf },
      update: { unitId },
      create: {
        rf,
        name: `${name} (planilha)`,
        role: "TECNICO",
        unitId,
        passwordHash: await hash(randomBytes(24).toString("hex"), 4),
      },
    });
    await db.$transaction((tx) => syncAccess(tx, u.id));
    technicians.set(name, u.id);
  }
  const now = new Date();
  let created = 0;
  let skipped = 0;
  for (const r of rows) {
    if (await db.process.findUnique({ where: { number: r.number } })) {
      skipped++;
      continue;
    }
    const unitId = unitOf(r.unit);
    const lastAt = r.lastAt ? new Date(r.lastAt) : now;
    const userId = r.technician ? technicians.get(r.technician) : undefined;
    await db.process.create({
      data: {
        number: r.number,
        protocol: r.protocol,
        system: r.system,
        subject: r.subject,
        unitId,
        status: r.status,
        instance: r.instance,
        decision: r.decision,
        priority: r.priority,
        priorityReason: r.priorityReason,
        notes: r.notes,
        closedAt: r.closed ? lastAt : null,
        lastOperationalAt: lastAt,
        createdAt: r.filedAt ? new Date(r.filedAt) : now,
        properties: {
          // Células com vários SQLs viram um imóvel por SQL (identifier é VARCHAR(191)).
          create: splitProperties(r.properties),
        },
        parties: {
          create: r.parties.map((name) => ({
            name,
            role: "Interessado",
            origin: ORIGIN,
          })),
        },
        groups: { create: { groupId: group.id } },
        assignments: userId
          ? {
              create: {
                userId,
                unitId,
                authorId: admin.id,
                reason: "Distribuição importada da planilha.",
                startedAt: r.assignedAt ? new Date(r.assignedAt) : lastAt,
                endedAt: r.closed ? lastAt : null,
              },
            }
          : undefined,
        history: {
          create: {
            kind: "Importação",
            origin: ORIGIN,
            externalKey: `planilha:${r.number}`,
            author: admin.name,
            description:
              "Processo importado da planilha de controle SERVIN para testes.",
            occurredAt: now,
          },
        },
      },
    });
    created++;
  }
  console.log(
    `Importação concluída: ${created} criados, ${skipped} já existentes, ${technicians.size} técnicos.`,
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
