import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { operate } from "@/lib/operations";
import { ZodError } from "zod";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await currentUser();
  if (!actor)
    return NextResponse.json({ error: "Faça login." }, { status: 401 });
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  try {
    return NextResponse.json(
      await operate(actor, (await params).id, await req.json()),
    );
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof ZodError
            ? "Revise os campos obrigatórios e as datas."
            : e instanceof Error && !("code" in e)
              ? e.message
              : "Não foi possível salvar. Verifique duplicidades e tente novamente.",
      },
      { status: 400 },
    );
  }
}
