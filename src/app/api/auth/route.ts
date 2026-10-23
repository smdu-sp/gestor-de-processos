import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashToken, openSession } from "@/lib/auth";
const attempts = new Map<string, { count: number; reset: number }>();
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const { rf, password } = await req.json();
  if (
    typeof rf !== "string" ||
    typeof password !== "string" ||
    password.length > 200
  )
    return NextResponse.json(
      { error: "Credenciais inválidas." },
      { status: 400 },
    );
  const key = rf.toLowerCase().slice(0, 100);
  const attempt = attempts.get(key) ?? { count: 0, reset: Date.now() + 900000 };
  if (attempt.reset < Date.now()) {
    attempt.count = 0;
    attempt.reset = Date.now() + 900000;
  }
  if (attempt.count >= 10)
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde 15 minutos." },
      { status: 429 },
    );
  attempt.count++;
  attempts.set(key, attempt);
  const user = await db.user.findUnique({ where: { rf: key } });
  if (!user?.active || !(await compare(password, user.passwordHash)))
    return NextResponse.json(
      { error: "RF ou senha inválidos." },
      { status: 401 },
    );
  attempts.delete(key);
  await openSession(user.id);
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const jar = await cookies();
  const token = jar.get("session")?.value;
  if (token)
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete("session");
  return NextResponse.json({ ok: true });
}
