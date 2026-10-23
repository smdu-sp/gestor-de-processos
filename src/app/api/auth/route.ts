import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashToken, openSession, SESSION_COOKIE } from "@/lib/auth";
import { authenticateCredentials } from "@/lib/credentials";
import { passwordlessDevelopment } from "@/lib/auth-mode";
const attempts = new Map<string, { count: number; reset: number }>();
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const body = await req.json().catch(() => null);
  const rf = body?.login ?? body?.rf;
  const password =
    body?.senha ??
    body?.password ??
    (passwordlessDevelopment() ? "" : undefined);
  if (
    typeof rf !== "string" ||
    typeof password !== "string" ||
    rf.trim().length !== 7 ||
    (!passwordlessDevelopment() && password.length < 1) ||
    password.length > 200
  )
    return NextResponse.json(
      { error: "Credenciais inválidas." },
      { status: 400 },
    );
  const key = rf.trim().toLowerCase();
  for (const [login, value] of attempts) {
    if (value.reset < Date.now()) attempts.delete(login);
  }
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
  let user;
  try {
    user = await authenticateCredentials(key, password);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível autenticar. Tente novamente mais tarde." },
      { status: 503 },
    );
  }
  if (!user)
    return NextResponse.json(
      { error: "Login ou senha inválidos, ou acesso ainda não liberado." },
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
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token)
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
