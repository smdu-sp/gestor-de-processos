import { z } from "zod";
import { db } from "./db";
import { fetchSei } from "./sources/sei";
import { fetchBiDatabase } from "./sources/bi";
const biRecord = z.object({
  id: z.string().min(1),
  number: z.string().min(1),
  subject: z.string().min(1),
  unitCode: z.string().min(1),
  status: z.string().optional(),
  updatedAt: z.iso.datetime({ offset: true }).optional(),
  properties: z
    .array(z.object({ identifier: z.string(), address: z.string() }))
    .default([]),
  parties: z
    .array(z.object({ name: z.string(), role: z.string() }))
    .default([]),
});
const seiRecord = z.object({
  number: z.string(),
  status: z.string(),
  events: z.array(
    z.object({
      id: z.string().min(1),
      description: z.string(),
      occurredAt: z.iso.datetime({ offset: true }),
      author: z.string().default("SEI"),
    }),
  ),
});
export const biPayload = z.object({
  complete: z.literal(true),
  processes: z.array(biRecord),
});
export const seiPayload = z.object({ processes: z.array(seiRecord) });
async function fetchSource(source: "BI" | "SEI") {
  if (source === "BI") return fetchBiDatabase();
  const processes = await db.process.findMany({
    where: { system: "SEI" },
    select: { number: true },
    orderBy: { number: "asc" },
  });
  return fetchSei(processes.map((p) => p.number));
}
export async function synchronize(source: "BI" | "SEI", supplied?: unknown) {
  // A trava não expira automaticamente durante uma execução: falha de processo exige liberação operacional.
  try {
    await db.syncLock.create({
      data: { id: "integrations", expiresAt: new Date(Date.now() + 3600000) },
    });
  } catch {
    throw new Error("Há uma sincronização em andamento.");
  }
  const run = await db.syncRun.create({ data: { source } });
  let processed = 0;
  try {
    const payload = supplied ?? (await fetchSource(source));
    if (source === "BI") {
      const { processes } = biPayload.parse(payload);
      if (
        new Set(processes.map((p) => p.id)).size !== processes.length ||
        new Set(processes.map((p) => p.number)).size !== processes.length
      )
        throw new Error("Lote BI contém identificadores duplicados.");
      await db.$transaction(
        async (tx) => {
          for (const record of processes) {
            const unit = await tx.unit.findUnique({
              where: { code: record.unitCode },
            });
            if (!unit)
              throw new Error(`Unidade não mapeada: ${record.unitCode}`);
            const byId = await tx.process.findUnique({
              where: { biId: record.id },
            });
            const byNumber = await tx.process.findUnique({
              where: { number: record.number },
            });
            if (
              (byId && byNumber && byId.id !== byNumber.id) ||
              (byNumber?.biId && byNumber.biId !== record.id) ||
              (byId && byId.number !== record.number)
            )
              throw new Error(`Conflito de identidade: ${record.number}`);
            const existing = byId ?? byNumber;
            const sourceData = {
              biId: record.id,
              subject: record.subject,
              sourceStatus: record.status ?? null,
              sourceUnit: record.unitCode,
              sourceUpdatedAt: record.updatedAt
                ? new Date(record.updatedAt)
                : null,
              biSyncedAt: new Date(),
              sourceMissing: false,
            };
            const p = existing
              ? await tx.process.update({
                  where: { id: existing.id },
                  data: sourceData,
                })
              : await tx.process.create({
                  data: {
                    ...sourceData,
                    number: record.number,
                    unitId: unit.id,
                  },
                });
            await tx.property.deleteMany({
              where: { processId: p.id, origin: "BI" },
            });
            await tx.party.deleteMany({
              where: { processId: p.id, origin: "BI" },
            });
            for (const property of record.properties)
              await tx.property.create({
                data: { ...property, origin: "BI", processId: p.id },
              });
            for (const party of record.parties)
              await tx.party.create({
                data: { ...party, origin: "BI", processId: p.id },
              });
            if (!existing || !existing.biId)
              await tx.history.create({
                data: {
                  processId: p.id,
                  kind: "Incorporação BI",
                  origin: "BI",
                  author: "Integração BI",
                  description:
                    "Processo vinculado ao BI. Dados operacionais preservados.",
                  occurredAt: new Date(),
                },
              });
            processed++;
          }
          await tx.process.updateMany({
            where: { biId: { not: null, notIn: processes.map((p) => p.id) } },
            data: { sourceMissing: true },
          });
        },
        { timeout: 60000 },
      );
    } else {
      const { processes } = seiPayload.parse(payload);
      await db.$transaction(
        async (tx) => {
          for (const record of processes) {
            const p = await tx.process.findUnique({
              where: { number: record.number },
            });
            if (!p)
              throw new Error(
                `Processo SEI não correspondido: ${record.number}`,
              );
            for (const event of record.events) {
              const key = JSON.stringify([record.number, event.id]);
              const previous = await tx.history.findUnique({
                where: { externalKey: key },
              });
              if (
                previous &&
                (previous.description !== event.description ||
                  previous.occurredAt.toISOString() !==
                    new Date(event.occurredAt).toISOString() ||
                  previous.author !== event.author)
              )
                throw new Error(
                  `Evento SEI alterado na origem: ${record.number}/${event.id}`,
                );
              if (!previous)
                await tx.history.create({
                  data: {
                    processId: p.id,
                    kind: "Movimentação SEI",
                    origin: "SEI",
                    externalKey: key,
                    author: event.author,
                    description: event.description,
                    occurredAt: new Date(event.occurredAt),
                  },
                });
            }
            if (p.seiStatus !== record.status)
              await tx.history.create({
                data: {
                  processId: p.id,
                  kind: "Status SEI observado",
                  origin: "SEI",
                  author: "Integração SEI",
                  description: `Status observado: ${p.seiStatus ?? "desconhecido"} → ${record.status}. Data de consulta; não representa data da mudança na origem.`,
                  occurredAt: new Date(),
                },
              });
            await tx.process.update({
              where: { id: p.id },
              data: { seiStatus: record.status, seiSyncedAt: new Date() },
            });
            processed++;
          }
        },
        { timeout: 60000 },
      );
    }
    await db.syncRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS",
        processed,
        finishedAt: new Date(),
        message: "Sincronização concluída.",
      },
    });
    return { processed };
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Resposta fora do contrato esperado."
        : error instanceof Error && !("code" in error)
          ? error.message
          : "Falha ao persistir lote; nenhuma alteração do lote foi aplicada.";
    await db.syncRun.update({
      where: { id: run.id },
      data: { status: "FAILED", processed: 0, finishedAt: new Date(), message },
    });
    throw new Error(message);
  } finally {
    await db.syncLock.delete({ where: { id: "integrations" } });
  }
}
