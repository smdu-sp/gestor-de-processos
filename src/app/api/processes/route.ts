import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser, assertUnit, canManage } from "@/lib/auth";
const schema = z.object({
  number: z.string().trim().min(5).max(100),
  subject: z.string().trim().min(3).max(500),
  unitId: z.string(),
  system: z.enum(["SEI", "AD", "FISICO"]),
  identifier: z.string().max(100),
  address: z.string().max(500),
  party: z.string().max(500),
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
  try {
    const v = schema.parse(await req.json());
    assertUnit(user, v.unitId);
    const p = await db.process.create({
      data: {
        number: v.number,
        subject: v.subject,
        unitId: v.unitId,
        system: v.system,
        properties:
          v.identifier || v.address
            ? { create: { identifier: v.identifier, address: v.address } }
            : undefined,
        parties: v.party
          ? { create: { name: v.party, role: "Requerente" } }
          : undefined,
        history: {
          create: {
            kind: "Cadastro manual",
            author: user.name,
            description: "Processo cadastrado manualmente.",
            occurredAt: new Date(),
          },
        },
      },
    });
    return NextResponse.json({ id: p.id });
  } catch {
    return NextResponse.json(
      {
        error:
          "Revise os campos. O número deve ser único e a unidade autorizada.",
      },
      { status: 400 },
    );
  }
}
