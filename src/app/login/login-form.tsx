"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import styles from "./login.module.css";
import { useTheme } from "@/components/theme";
export function LoginForm({
  passwordOptional = false,
}: {
  passwordOptional?: boolean;
}) {
  const { dark, setTheme } = useTheme();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setReady(true), []);
  const photo = dark
    ? "/login/martinelli_noite.jpeg"
    : "/login/martinelli_dia.jpg";
  return (
    <main className={styles.login} data-theme={dark ? "dark" : "light"}>
      <img src={photo} alt="" className={styles.background} />
      <section
        className={styles.card}
        aria-label="Acesso à Gestão de Processos"
      >
        <form
          className={styles.form}
          method="post"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            const data = new FormData(event.currentTarget);
            try {
              const response = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  login: data.get("login"),
                  senha: data.get("senha"),
                }),
              });
              const result = await response.json();
              if (!response.ok)
                throw new Error(result.error || "Falha ao entrar.");
              window.location.assign("/");
            } catch (error) {
              setError(
                error instanceof Error ? error.message : "Falha de conexão.",
              );
              setBusy(false);
            }
          }}
        >
          <img
            className={styles.logo}
            src={dark ? "/login/smul_branco.png" : "/login/smul_azul.png"}
            alt="SMUL — Secretaria Municipal de Urbanismo e Licenciamento"
          />
          <label htmlFor="login">
            Login
            <input
              id="login"
              name="login"
              required
              minLength={7}
              maxLength={7}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
          </label>
          <label htmlFor="senha">
            Senha
            <input
              id="senha"
              name="senha"
              type="password"
              required={!passwordOptional}
              maxLength={200}
              autoComplete="current-password"
            />
          </label>
          <button type="submit" disabled={!ready || busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
        </form>
        <div className={styles.photo}>
          <img src={photo} alt="Edifício Martinelli" />
        </div>
        <details className={styles.themeMenu}>
          <summary
            className={styles.theme}
            aria-label="Toggle theme"
            role="button"
          >
            {dark ? <Moon size={17} /> : <Sun size={17} />}
          </summary>
          <div className={styles.menu}>
            {[
              ["light", "Claro"],
              ["dark", "Escuro"],
              ["system", "Sistema"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={(event) => {
                  setTheme(value as "light" | "dark" | "system");
                  try {
                    localStorage.setItem("gestao-login-theme", value);
                  } catch {}
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open");
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </details>
      </section>
    </main>
  );
}
