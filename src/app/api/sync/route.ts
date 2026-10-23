import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { synchronize } from "@/lib/integrations";
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (
    user?.role !== "ADMIN" ||
    req.headers.get("origin") !== req.nextUrl.origin
  )
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 403 },
    );
  const { source } = await req.json();
  if (source !== "BI" && source !== "SEI")
    return NextResponse.json({ error: "Fonte inválida." }, { status: 400 });
  try {
    return NextResponse.json(await synchronize(source));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha na sincronização." },
      { status: 400 },
    );
  }
}
