import { z } from "zod";
import { db } from "./db";
import { Actor, assertUnit, canManage } from "./auth";
import { statuses, validateInterval } from "./domain";
const text = z.string().trim().min(1).max(2000);
export const operationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("assign"),
    version: z.number().int(),
    userId: text,
    unitId: text,
    reason: text,
  }),
  z.object({
    action: z.literal("activity"),
    version: z.number().int(),
    category: z.enum(["TECNICA", "ADMINISTRATIVA"]),
    type: text,
    description: text,
    startedAt: z.iso.datetime(),
    endedAt: z.iso.datetime().optional(),
  }),
  z.object({
    action: z.literal("finish"),
    version: z.number().int(),
    activityId: text,
  }),
  z.object({
    action: z.literal("status"),
    version: z.number().int(),
    status: z.enum(statuses as [string, ...string[]]),
    reason: text,
  }),
  z.object({
    action: z.literal("close"),
    version: z.number().int(),
    reason: text,
  }),
  z.object({
    action: z.literal("reopen"),
    version: z.number().int(),
    reason: text,
  }),
  z.object({
    action: z.literal("notes"),
    version: z.number().int(),
    notes: z.string().max(10000),
    priority: z.boolean(),
    reason: z.string().max(2000),
  }),
  z.object({
    action: z.literal("letter"),
    version: z.number().int(),
    number: text,
    recipient: text,
  }),
  z.object({
    action: z.literal("location"),
    version: z.number().int(),
    location: text,
    volumes: z.number().int().nonnegative(),
    boxes: z.number().int().nonnegative(),
  }),
  z.object({
    action: z.literal("group"),
    version: z.number().int(),
    groupId: text,
  }),
  z.object({
    action: z.literal("letterStatus"),
    version: z.number().int(),
    letterId: text,
    stage: z.enum(["sent", "replied", "closed"]),
  }),
]);
export async function operate(actor: Actor, id: string, raw: unknown) {
  const op = operationSchema.parse(raw);
  return db.$transaction(async (tx) => {
    const p = await tx.process.findUniqueOrThrow({ where: { id } });
    assertUnit(actor, p.unitId);
    if (actor.role === "CONSULTA")
      throw new Error("Perfil somente de consulta.");
    if (
      ["assign", "status", "close", "reopen"].includes(op.action) &&
      !canManage(actor)
    )
      throw new Error("Ação permitida somente à gestão.");
    if (p.closedAt && op.action !== "reopen")
      throw new Error("Reabra o acompanhamento antes de alterar.");
    const changed = await tx.process.updateMany({
      where: { id, version: op.version },
      data: { version: { increment: 1 }, lastOperationalAt: new Date() },
    });
    if (!changed.count)
      throw new Error(
        "O processo foi alterado por outro usuário. Atualize a página e revise os dados.",
      );
    let description = "";
    let occurredAt = new Date();
    if (op.action === "assign") {
      assertUnit(actor, op.unitId);
      const target = await tx.user.findFirst({
        where: {
          id: op.userId,
          active: true,
          memberships: { some: { unitId: op.unitId } },
          role: { in: ["TECNICO", "GESTOR", "ADMIN", "ADMINISTRATIVO"] },
        },
      });
      if (!target)
        throw new Error("Responsável não pertence à unidade de destino.");
      await tx.assignment.updateMany({
        where: { processId: id, endedAt: null },
        data: { endedAt: occurredAt },
      });
      await tx.assignment.create({
        data: {
          processId: id,
          userId: target.id,
          unitId: op.unitId,
          authorId: actor.id,
          reason: op.reason,
        },
      });
      await tx.process.update({ where: { id }, data: { unitId: op.unitId } });
      description = `Distribuição para ${target.name}. ${op.reason}. Atividades anteriores mantêm sua autoria.`;
    } else if (op.action === "activity") {
      if (actor.role === "ADMINISTRATIVO" && op.category !== "ADMINISTRATIVA")
        throw new Error(
          "Perfil administrativo registra apenas atividades administrativas.",
        );
      if (
        actor.role === "TECNICO" &&
        !(await tx.assignment.findFirst({
          where: { processId: id, userId: actor.id, endedAt: null },
        }))
      )
        throw new Error("Processo fora da sua carteira.");
      occurredAt = new Date(op.startedAt);
      const end = op.endedAt ? new Date(op.endedAt) : null;
      validateInterval(occurredAt, end);
      await tx.activity.create({
        data: {
          processId: id,
          userId: actor.id,
          unitId: p.unitId,
          category: op.category,
          type: op.type,
          description: op.description,
          startedAt: occurredAt,
          endedAt: end,
        },
      });
      description = `${op.type}: ${op.description}${end ? " — concluída" : " — iniciada"}`;
    } else if (op.action === "finish") {
      const a = await tx.activity.findFirst({
        where: { id: op.activityId, processId: id, endedAt: null },
      });
      if (!a || (a.userId !== actor.id && !canManage(actor)))
        throw new Error("Atividade indisponível para conclusão.");
      validateInterval(a.startedAt, occurredAt);
      await tx.activity.update({
        where: { id: a.id },
        data: { endedAt: occurredAt },
      });
      description = `Atividade concluída: ${a.type}. Autoria original preservada.`;
    } else if (op.action === "status") {
      await tx.process.update({ where: { id }, data: { status: op.status } });
      description = `Situação: ${p.status} → ${op.status}. ${op.reason}`;
    } else if (op.action === "close" || op.action === "reopen") {
      if (op.action === "reopen" && !p.closedAt)
        throw new Error("Processo já está ativo.");
      if (
        op.action === "close" &&
        (await tx.activity.count({ where: { processId: id, endedAt: null } }))
      )
        throw new Error("Conclua as atividades abertas antes de encerrar.");
      await tx.process.update({
        where: { id },
        data: { closedAt: op.action === "close" ? occurredAt : null },
      });
      description = `${op.action === "close" ? "Encerramento" : "Reabertura"} do acompanhamento. ${op.reason}`;
    } else if (op.action === "notes") {
      if (!canManage(actor))
        throw new Error("Complementação permitida à gestão.");
      if (op.priority && !op.reason.trim())
        throw new Error("Informe o motivo da prioridade.");
      await tx.process.update({
        where: { id },
        data: {
          notes: op.notes,
          priority: op.priority,
          priorityReason: op.reason,
        },
      });
      description = `Complementação: ${JSON.stringify({ antes: { notes: p.notes, priority: p.priority, reason: p.priorityReason }, depois: op })}`;
    } else if (op.action === "letter") {
      if (!canManage(actor) && actor.role !== "ADMINISTRATIVO")
        throw new Error("Ação administrativa.");
      await tx.letter.create({
        data: { processId: id, number: op.number, recipient: op.recipient },
      });
      description = `Ofício cadastrado: ${op.number}, destinatário ${op.recipient}.`;
    } else if (op.action === "location") {
      if (!canManage(actor) && actor.role !== "ADMINISTRATIVO")
        throw new Error("Ação administrativa.");
      await tx.physicalLocation.create({
        data: {
          processId: id,
          location: op.location,
          volumes: op.volumes,
          boxes: op.boxes,
        },
      });
      description = `Localização física: ${op.location}; ${op.volumes} volumes, ${op.boxes} caixas. Não encerra acompanhamento.`;
    } else if (op.action === "group") {
      if (!canManage(actor))
        throw new Error("Ação permitida somente à gestão.");
      const group = await tx.group.findUniqueOrThrow({
        where: { id: op.groupId },
      });
      await tx.processGroup.upsert({
        where: { processId_groupId: { processId: id, groupId: group.id } },
        update: {},
        create: { processId: id, groupId: group.id },
      });
      description = `Vinculado ao grupo ${group.name}.`;
    } else if (op.action === "letterStatus") {
      if (!canManage(actor) && actor.role !== "ADMINISTRATIVO")
        throw new Error("Ação administrativa.");
      const letter = await tx.letter.findFirst({
        where: { id: op.letterId, processId: id },
      });
      if (!letter) throw new Error("Ofício não encontrado.");
      if (letter.closedAt) throw new Error("Ofício já encerrado.");
      if (op.stage === "sent" && letter.sentAt)
        throw new Error("Envio já registrado.");
      if (op.stage === "replied" && (!letter.sentAt || letter.repliedAt))
        throw new Error(
          "Registre o envio antes da resposta; respostas não podem ser duplicadas.",
        );
      await tx.letter.update({
        where: { id: letter.id },
        data:
          op.stage === "sent"
            ? { sentAt: occurredAt }
            : op.stage === "replied"
              ? { repliedAt: occurredAt }
              : { closedAt: occurredAt },
      });
      description = `Ofício ${letter.number}: ${op.stage === "sent" ? "envio registrado" : op.stage === "replied" ? "resposta registrada" : "encerrado"}.`;
    }
    await tx.history.create({
      data: {
        processId: id,
        kind: op.action,
        author: actor.name,
        description,
        occurredAt,
      },
    });
    return { ok: true };
  });
}
