"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
type Option = { id: string; label: string };
type Found = {
  login: string;
  name: string;
  email: string;
  existing: { id: string; active: boolean } | null;
};
export function StaffForm({
  divisions,
  roles,
}: {
  divisions: { coordination: string; units: Option[] }[];
  roles: Option[];
}) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setFound(null);
    try {
      const r = await fetch(
        `/api/staff/lookup?login=${encodeURIComponent(login.trim())}`,
      );
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      setFound(result);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!found) return;
    setBusy(true);
    setMessage("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          rf: found.login,
          id: found.existing?.id,
          active: true,
        }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      setMessage(`${found.name} cadastrado(a).`);
      setFound(null);
      setLogin("");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="staff-form">
      <form className="lookup" onSubmit={search}>
        <label>
          Login de rede
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="d123456"
            pattern="[A-Za-z][0-9]{6}"
            title="Letra seguida de 6 dígitos"
            required
          />
        </label>
        <button disabled={busy}>
          <Search size={16} /> {busy && !found ? "Buscando…" : "Buscar no LDAP"}
        </button>
      </form>
      {found && (
        <form className="action-form" onSubmit={save}>
          <dl>
            <dt>Nome</dt>
            <dd>{found.name}</dd>
            <dt>E-mail</dt>
            <dd>{found.email || "Não informado"}</dd>
          </dl>
          {found.existing && (
            <p className="hint">
              Já existe cadastro para este login
              {found.existing.active ? "" : " (inativo)"}; salvar atualiza a
              lotação, o perfil e reativa o acesso.
            </p>
          )}
          <div className="form-grid">
            <label>
              Divisão *
              <select name="unitId" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {divisions.map((c) => (
                  <optgroup key={c.coordination} label={c.coordination}>
                    {c.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label>
              Perfil *
              <select name="role" defaultValue="TECNICO">
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button disabled={busy}>
            {busy ? "Salvando…" : "Cadastrar servidor"}
          </button>
        </form>
      )}
      {message && (
        <p role="status" className="form-message">
          {message}
        </p>
      )}
    </div>
  );
}
