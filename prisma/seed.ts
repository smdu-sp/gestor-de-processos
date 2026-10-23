import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 12)
    throw new Error("Defina SEED_PASSWORD com pelo menos 12 caracteres.");
  const servin = await db.coordination.upsert({
    where: { code: "SERVIN" },
    update: {},
    create: {
      code: "SERVIN",
      name: "Coordenadoria de Serviços e Uso Institucional",
    },
  });
  for (const [code, name] of [
    ["SERVIN-G", "Gabinete da Coordenadoria"],
    ["DSIMP", "Divisão DSIMP"],
    ["DSIGP", "Divisão DSIGP"],
  ])
    await db.unit.upsert({
      where: { code },
      update: {},
      create: { code, name, coordinationId: servin.id },
    });
  const units = await db.unit.findMany({ orderBy: { code: "asc" } });
  const admin = await db.user.upsert({
    where: { rf: "d000001" },
    update: {},
    create: {
      rf: "d000001",
      name: "Gestão local",
      role: "ADMIN",
      unitId: units.find((u) => u.code === "SERVIN-G")!.id,
      passwordHash: await hash(password, 12),
      memberships: { create: units.map((u) => ({ unitId: u.id })) },
    },
  });
  await db.user.upsert({
    where: { rf: "d854440" },
    update: {
      name: "Bruno Luiz Vieira",
      email: "blvieira@prefeitura.sp.gov.br",
    },
    create: {
      rf: "d854440",
      name: "Bruno Luiz Vieira",
      email: "blvieira@prefeitura.sp.gov.br",
      role: "CONSULTA",
      passwordHash: await hash(password, 12),
    },
  });
  if (process.env.DEMO_MODE !== "true") return;
  for (let i = 0; i < 3; i++) {
    const unit = units[i];
    const user = await db.user.upsert({
      where: { rf: `d00000${i + 2}` },
      update: {},
      create: {
        rf: `d00000${i + 2}`,
        name: [
          "Ana Martins (exemplo)",
          "Bruno Costa (exemplo)",
          "Carla Souza (exemplo)",
        ][i],
        role: "TECNICO",
        unitId: unit.id,
        passwordHash: await hash(password, 12),
        memberships: { create: { unitId: unit.id } },
      },
    });
    for (let j = 0; j < 4; j++) {
      const number = `6068.2026/000${i}${j}00-0`;
      if (await db.process.findUnique({ where: { number } })) continue;
      const startedAt = new Date(Date.now() - (j + 2) * 86400000);
      const p = await db.process.create({
        data: {
          number,
          subject: [
            "Alvará de aprovação e execução",
            "Reforma de equipamento público",
            "Regularização de edificação",
            "Certificado de conclusão",
          ][j],
          unitId: unit.id,
          priority: j === 0,
          priorityReason: j === 0 ? "Equipamento de atendimento público" : null,
          status:
            j === 3
              ? "Aguardando distribuição"
              : j === 2
                ? "Aguardando documentos"
                : "Em análise",
          notes:
            "Registro fictício para demonstração. Não representa processo oficial.",
          lastOperationalAt: startedAt,
          properties: {
            create: {
              identifier: `123.00${i}.000${j}-0`,
              address: `Rua de Exemplo, ${100 + j}`,
            },
          },
          parties: {
            create: {
              name: `Empreendimento demonstrativo ${i * 4 + j + 1}`,
              role: "Requerente",
            },
          },
          history: {
            create: {
              kind: "Cadastro",
              author: admin.name,
              description: "Cadastro demonstrativo.",
              occurredAt: startedAt,
            },
          },
        },
      });
      if (j !== 3) {
        await db.assignment.create({
          data: {
            processId: p.id,
            userId: user.id,
            unitId: unit.id,
            authorId: admin.id,
            reason: "Distribuição demonstrativa",
            startedAt,
          },
        });
        await db.activity.create({
          data: {
            processId: p.id,
            userId: user.id,
            unitId: unit.id,
            category: "TECNICA",
            type: "Análise técnica",
            description: "Atividade demonstrativa",
            startedAt,
            endedAt: j === 2 ? new Date(Date.now() - 86400000) : null,
          },
        });
      }
    }
  }
  for (const name of ["Hospitais", "CEUs", "TJ-SP", "SESCs"])
    await db.group.upsert({ where: { name }, update: {}, create: { name } });
  console.log(
    "Seed concluído. RF administrador: d000001. Senha: valor de SEED_PASSWORD.",
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
