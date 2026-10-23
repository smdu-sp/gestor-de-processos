"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
export function Logout() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setReady(true), []);
  return (
    <>
      <button
        className="ghost"
        disabled={!ready || busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/api/auth", { method: "DELETE" });
            if (!response.ok)
              throw new Error("Falha ao sair. Tente novamente.");
            window.location.href = "/login";
          } catch {
            setError("Falha ao sair. Tente novamente.");
            setBusy(false);
          }
        }}
      >
        Sair
      </button>
      {error && <span role="alert">{error}</span>}
    </>
  );
}
export function ActionForm({
  url,
  children,
  values = {},
  label = "Salvar",
  onSuccess,
}: {
  url: string;
  children?: React.ReactNode;
  values?: Record<string, unknown>;
  label?: string;
  onSuccess?: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const router = useRouter();
  return (
    <form
      method="post"
      className="action-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const form = e.currentTarget;
        const data: Record<string, unknown> = {
          ...values,
          ...Object.fromEntries(new FormData(form)),
        };
        for (const key of ["volumes", "boxes"])
          if (key in data) data[key] = Number(data[key]);
        if ("priority" in data) data.priority = data.priority === "on";
        for (const key of ["startedAt", "endedAt"])
          if (data[key])
            data[key] = new Date(`${data[key]}:00-03:00`).toISOString();
          else delete data[key];
        try {
          const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const result = await r.json();
          if (!r.ok) throw new Error(result.error);
          setMessage("Salvo com sucesso.");
          if (onSuccess)
            router.push(
              onSuccess === "detail" ? `/processos/${result.id}` : onSuccess,
            );
          router.refresh();
        } catch (e) {
          setMessage(
            e instanceof Error
              ? e.message
              : "Falha de conexão. Tente novamente.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
      <button disabled={busy || !ready}>{busy ? "Salvando…" : label}</button>
      {message && (
        <p role="status" className="form-message">
          {message}
        </p>
      )}
    </form>
  );
}
