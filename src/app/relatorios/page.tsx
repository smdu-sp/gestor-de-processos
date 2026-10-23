import { redirect } from "next/navigation";
import { currentUser, unitScope } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import { formatDate } from "@/lib/domain";
export default async function Reports({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; unit?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const s = await searchParams;
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  const month = new Date(Date.now() - 30 * 86400000).toLocaleDateString(
    "en-CA",
    { timeZone: "America/Sao_Paulo" },
  );
  const startText = /^\d{4}-\d{2}-\d{2}$/.test(s.start ?? "")
    ? s.start!
    : month;
  const endText = /^\d{4}-\d{2}-\d{2}$/.test(s.end ?? "") ? s.end! : today;
  const start = new Date(`${startText}T00:00:00-03:00`);
  const end = new Date(`${endText}T23:59:59.999-03:00`);
  const valid =
    Number.isFinite(start.getTime()) &&
    Number.isFinite(end.getTime()) &&
    end >= start;
  const scope = {
    AND: [unitScope(user), ...(s.unit ? [{ unitId: s.unit }] : [])],
  };
  const activities = valid
    ? await db.activity.findMany({
        where: {
          ...scope,
          OR: [
            { startedAt: { gte: start, lte: end } },
            { endedAt: { gte: start, lte: end } },
            {
              startedAt: { lte: end },
              OR: [{ endedAt: null }, { endedAt: { gt: end } }],
            },
          ],
        },
        include: { user: true, unit: true },
      })
    : [];
  const units = await db.unit.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : { memberships: { some: { userId: user.id } } },
  });
  type Metric = {
    name: string;
    unit: string;
    started: number;
    completed: number;
    open: number;
    durations: number[];
  };
  const byUser = new Map<string, Metric>();
  const byUnit = new Map<string, Metric>();
  for (const a of activities) {
    for (const [map, key, name, unit] of [
      [byUser, `${a.unitId}/${a.userId}`, a.user.name, a.unit.code],
      [byUnit, a.unitId, a.unit.name, a.unit.code],
    ] as const) {
      const m = map.get(key) ?? {
        name,
        unit,
        started: 0,
        completed: 0,
        open: 0,
        durations: [],
      };
      if (a.startedAt >= start && a.startedAt <= end) m.started++;
      if (a.startedAt <= end && (!a.endedAt || a.endedAt > end)) m.open++;
      if (a.endedAt && a.endedAt >= start && a.endedAt <= end) {
        m.completed++;
        m.durations.push(
          (a.endedAt.getTime() - a.startedAt.getTime()) / 86400000,
        );
      }
      map.set(key, m);
    }
  }
  function table(rows: Metric[]) {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Responsável / unidade histórica</th>
              <th>Iniciadas no período</th>
              <th>Abertas no fim do período</th>
              <th>Concluídas no período</th>
              <th>Duração média decorrida</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={i}>
                <td>
                  <strong>{m.name}</strong>
                  <small>{m.unit}</small>
                </td>
                <td>{m.started}</td>
                <td>{m.open}</td>
                <td>
                  <strong>{m.completed}</strong>
                </td>
                <td>
                  {m.durations.length
                    ? `${(m.durations.reduce((a, b) => a + b, 0) / m.durations.length).toFixed(1)} dias`
                    : "Sem dados"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="empty">Sem atividades no período selecionado.</p>
        )}
      </div>
    );
  }
  return (
    <Shell user={user} active="Produção e relatórios">
      <div className="page-heading">
        <div>
          <div className="eyebrow">INDICADORES DE TRABALHO REGISTRADO</div>
          <h1>Produção e relatórios</h1>
          <p>
            Referência: {formatDate(new Date())} · contagem de atividades, sem
            pesos de complexidade
          </p>
        </div>
      </div>
      <section className="panel">
        <form className="filters">
          <label>
            Início
            <input type="date" name="start" defaultValue={startText} required />
          </label>
          <label>
            Fim
            <input type="date" name="end" defaultValue={endText} required />
          </label>
          <label>
            Unidade da atividade
            <select name="unit" defaultValue={s.unit}>
              <option value="">Todas autorizadas</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code}
                </option>
              ))}
            </select>
          </label>
          <button>Atualizar indicadores</button>
        </form>
        {!valid && (
          <p role="alert" className="error">
            Período inválido. Revise início e fim.
          </p>
        )}
      </section>
      <div className="notice">
        A produção permanece na unidade e com o técnico registrados na
        atividade, mesmo após redistribuição. Tempo decorrido inclui esperas e
        não equivale a horas trabalhadas. Eventos SEI não entram nesta contagem.
      </div>
      <section className="panel">
        <h2>Por coordenadoria / unidade</h2>
        {table([...byUnit.values()])}
      </section>
      <section className="panel">
        <h2>Por técnico e unidade</h2>
        {table([...byUser.values()])}
      </section>
    </Shell>
  );
}
