import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser, canManage } from "@/lib/auth";
import {
  assertCanManageStaff,
  loginPattern,
  lookupLdap,
  roles,
  syncAccess,
} from "@/lib/staff";
const schema = z.object({
  id: z.string().optional(),
  rf: z.string().trim().toLowerCase().regex(loginPattern).optional(),
  unitId: z.string().min(1, "Selecione a divisão."),
  role: z.enum(roles),
  active: z.preprocess((v) => v === true || v === "on", z.boolean()),
});
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user || !canManage(user))
    return NextResponse.json(
      { error: "Acesso restrito à gestão." },
      { status: 403 },
    );
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || (!parsed.data.id && !parsed.data.rf))
    return NextResponse.json(
      { error: "Revise login, divisão e perfil." },
      { status: 400 },
    );
  const v = parsed.data;
  try {
    const target = v.id
      ? await db.user.findUniqueOrThrow({ where: { id: v.id } })
      : await db.user.findUnique({ where: { rf: v.rf! } });
    assertCanManageStaff(user, target, v);
    if (target?.id === user.id && (!v.active || v.role !== user.role))
      throw new Error(
        "Você não pode alterar o próprio perfil ou desativar-se.",
      );
    // Nome e e-mail vêm sempre do LDAP no cadastro; nunca do formulário.
    const person = target ? null : await lookupLdap(v.rf!);
    if (!target && !person) throw new Error("Login não encontrado no LDAP.");
    const saved = await db.$transaction(async (tx) => {
      const data = { unitId: v.unitId, role: v.role, active: v.active };
      const u = target
        ? await tx.user.update({ where: { id: target.id }, data })
        : await tx.user.create({
            data: {
              ...data,
              rf: v.rf!,
              name: person!.name,
              email: person!.email || null,
              passwordHash: "",
            },
          });
      await syncAccess(tx, u.id);
      return u;
    });
    return NextResponse.json({ id: saved.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao salvar." },
      { status: 400 },
    );
  }
}
