import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, canManage } from "@/lib/auth";
import { db } from "@/lib/db";
import { processFilter } from "@/lib/queries";
import { statuses } from "@/lib/domain";
import { Shell } from "@/components/shell";
import { ProcessTable } from "@/components/process-table";
export default async function Processes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const s = await searchParams;
  const where = processFilter(user, s);
  const page = Math.max(1, Math.min(100000, Number(s.page) || 1));
  const pageSize = 20;
  const [rows, total, units] = await Promise.all([
    db.process.findMany({
      where,
      include: {
        unit: true,
        parties: true,
        assignments: { where: { endedAt: null }, include: { user: true } },
      },
      orderBy: { lastOperationalAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.process.count({ where }),
    db.unit.findMany({
      where:
        user.role === "ADMIN"
          ? {}
          : { memberships: { some: { userId: user.id } } },
    }),
  ]);
  const params = new URLSearchParams(
    Object.entries(s).filter(
      (v): v is [string, string] => typeof v[1] === "string",
    ),
  );
  const back = `/processos?${params}`;
  function pageLink(n: number) {
    const p = new URLSearchParams(params);
    p.set("page", String(n));
    return `/processos?${p}`;
  }
  return (
    <Shell
      user={user}
      active={s.mine === "true" ? "Minha carteira" : "Processos"}
    >
      <div className="page-heading">
        <div>
          <div className="eyebrow">CARTEIRA DE LICENCIAMENTO</div>
          <h1>{s.mine === "true" ? "Minha carteira" : "Processos"}</h1>
          <p>{total} registros encontrados · somente unidades autorizadas</p>
        </div>
        <div className="actions">
          <a className="button secondary" href={`/api/export?${params}`}>
            Exportar CSV
          </a>
          {canManage(user) && (
            <Link className="button" href="/processos/novo">
              + Adicionar processo
            </Link>
          )}
        </div>
      </div>
      <section className="panel">
        <form className="filters">
          <label className="search-field">
            Buscar processo
            <input
              name="q"
              defaultValue={s.q}
              placeholder="Número, assunto, SQL, endereço ou interessado"
            />
          </label>
          <label>
            Unidade
            <select name="unit" defaultValue={s.unit}>
              <option value="">Todas autorizadas</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code}
                </option>
              ))}
            </select>
          </label>
          <label>
            Situação
            <select name="status" defaultValue={s.status}>
              <option value="">Todas</option>
              {statuses.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Acompanhamento
            <select name="closed" defaultValue={s.closed ?? "false"}>
              <option value="false">Ativos</option>
              <option value="true">Encerrados</option>
            </select>
          </label>
          <label>
            Sem ação local há (dias)
            <input
              name="days"
              type="number"
              min="1"
              max="36500"
              defaultValue={s.days}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              name="priority"
              value="true"
              defaultChecked={s.priority === "true"}
            />
            Prioritários
          </label>
          <label className="check">
            <input
              type="checkbox"
              name="unassigned"
              value="true"
              defaultChecked={s.unassigned === "true"}
            />
            Sem distribuição
          </label>
          {s.mine && <input type="hidden" name="mine" value={s.mine} />}
          {s.group && <input type="hidden" name="group" value={s.group} />}
          <button>Aplicar filtros</button>
          <Link href="/processos">Limpar filtros</Link>
        </form>
        <ProcessTable rows={rows} back={back} />
        <div className="pagination">
          <span>
            Página {page} · {total} processos
          </span>
          <div>
            {page > 1 && <Link href={pageLink(page - 1)}>← Anterior</Link>}
            {page * pageSize < total && (
              <Link href={pageLink(page + 1)}>Próxima →</Link>
            )}
          </div>
        </div>
      </section>
    </Shell>
  );
}
