import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, canManage } from "@/lib/auth";
import { loginPattern, lookupLdap } from "@/lib/staff";
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user || !canManage(user))
    return NextResponse.json(
      { error: "Acesso restrito à gestão." },
      { status: 403 },
    );
  const login =
    req.nextUrl.searchParams.get("login")?.trim().toLowerCase() ?? "";
  if (!loginPattern.test(login))
    return NextResponse.json(
      { error: "Informe o login de rede (ex.: d123456)." },
      { status: 400 },
    );
  try {
    const person = await lookupLdap(login);
    if (!person)
      return NextResponse.json(
        { error: "Login não encontrado no LDAP." },
        { status: 404 },
      );
    const existing = await db.user.findUnique({
      where: { rf: login },
      select: { id: true, active: true },
    });
    return NextResponse.json({ ...person, existing });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Serviço LDAP indisponível." },
      { status: 503 },
    );
  }
}
