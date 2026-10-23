import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { syncAccess } from "@/lib/staff";
const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9/-]{1,29}$/, "Sigla inválida.");
const name = z.string().trim().min(3).max(150);
const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("coordination"),
    id: z.string().optional(),
    code,
    name,
  }),
  z.object({
    kind: z.literal("division"),
    id: z.string().optional(),
    code,
    name,
    coordinationId: z.string().min(1),
  }),
]);
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN")
    return NextResponse.json(
      { error: "Acesso restrito a administradores." },
      { status: 403 },
    );
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Informe sigla (2 a 30 caracteres) e nome." },
      { status: 400 },
    );
  const v = parsed.data;
  try {
    await db.$transaction(async (tx) => {
      if (v.kind === "coordination") {
        const data = { code: v.code, name: v.name };
        if (v.id) await tx.coordination.update({ where: { id: v.id }, data });
        else await tx.coordination.create({ data });
        return;
      }
      const data = {
        code: v.code,
        name: v.name,
        coordinationId: v.coordinationId,
      };
      if (v.id) await tx.unit.update({ where: { id: v.id }, data });
      else await tx.unit.create({ data });
      // Nova divisão ou troca de coordenadoria muda o alcance de gestores e administradores.
      const managers = await tx.user.findMany({
        where: { role: { in: ["ADMIN", "GESTOR"] } },
        select: { id: true },
      });
      for (const m of managers) await syncAccess(tx, m.id);
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível salvar. A sigla deve ser única." },
      { status: 400 },
    );
  }
}
