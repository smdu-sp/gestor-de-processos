"use client";
import { useState, useEffect } from "react";
export default function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <main className="login">
      <section className="panel">
        <div className="eyebrow">LICENCIAMENTO · GESTÃO OPERACIONAL</div>
        <h1>Gestão de processos</h1>
        <p>Uma visão integrada da carteira, do histórico e da produção.</p>
        <form
          method="post"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const f = new FormData(e.currentTarget);
            try {
              const r = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  rf: f.get("rf"),
                  password: f.get("password"),
                }),
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              window.location.href = "/";
            } catch (e) {
              setError(e instanceof Error ? e.message : "Falha de conexão.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Registro funcional
            <input
              name="rf"
              required
              autoComplete="username"
              placeholder="d000001"
            />
          </label>
          <label>
            Senha
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <button disabled={busy || !ready}>
            {busy ? "Entrando…" : "Entrar no sistema"}
          </button>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </form>
        <small>Utilize as credenciais cadastradas pela administração.</small>
      </section>
    </main>
  );
}
