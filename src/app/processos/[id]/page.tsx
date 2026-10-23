import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser, unitScope, canManage } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, statuses } from "@/lib/domain";
import { Shell } from "@/components/shell";
import { ActionForm } from "@/components/widgets";
import { ComplementaryControls } from "@/components/complementary-controls";
export default async function Detail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const p = await db.process.findFirst({
    where: { id, ...unitScope(user) },
    include: {
      unit: true,
      properties: true,
      parties: true,
      assignments: { where: { endedAt: null }, include: { user: true } },
      activities: {
        include: { user: true, unit: true },
        orderBy: { startedAt: "desc" },
      },
      history: { orderBy: [{ occurredAt: "desc" }, { recordedAt: "desc" }] },
      letters: true,
      locations: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!p) notFound();
  const units = await db.unit.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : { memberships: { some: { userId: user.id } } },
  });
  const people = await db.user.findMany({
    where: {
      active: true,
      memberships: { some: { unitId: { in: units.map((u) => u.id) } } },
    },
  });
  const back = (await searchParams).back;
  const safeBack = back?.startsWith("/processos?") ? back : "/processos";
  const url = `/api/processes/${id}`;
  const values = { version: p.version };
  return (
    <Shell user={user} active="Processos">
      <Link href={safeBack}>← Voltar à carteira</Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {p.system} · {p.unit.code} · {p.closedAt ? "ENCERRADO" : "ATIVO"}
          </div>
          <h1>{p.number}</h1>
          <p>{p.subject}</p>
        </div>
        <span className="badge blue">{p.status}</span>
      </div>
      {p.sourceMissing && (
        <div className="warning">
          Processo ausente no último lote completo do BI. Verifique a origem; o
          acompanhamento foi preservado.
        </div>
      )}
      <div className="detail-summary">
        <div>
          <small>Responsável atual</small>
          <strong>{p.assignments[0]?.user.name ?? "Não atribuído"}</strong>
        </div>
        <div>
          <small>Prioridade</small>
          <strong>{p.priority ? p.priorityReason : "Normal"}</strong>
        </div>
        <div>
          <small>Última ação operacional</small>
          <strong>{formatDate(p.lastOperationalAt)}</strong>
        </div>
        <div>
          <small>Instância / decisão</small>
          <strong>
            {p.instance} / {p.decision ?? "Sem decisão"}
          </strong>
        </div>
      </div>
      <div className="two-col">
        <section className="panel">
          <h2>Dados de origem</h2>
          <dl>
            <dt>Identificador BI</dt>
            <dd>{p.biId ?? "Cadastro manual — sem vínculo"}</dd>
            <dt>Situação / unidade no BI</dt>
            <dd>
              {p.sourceStatus ?? "Não informada"} /{" "}
              {p.sourceUnit ?? "Não informada"}
            </dd>
            <dt>Atualização na origem</dt>
            <dd>{formatDate(p.sourceUpdatedAt)}</dd>
            <dt>Última consulta BI</dt>
            <dd>{formatDate(p.biSyncedAt)}</dd>
            <dt>Status SEI</dt>
            <dd>{p.seiStatus ?? "Ainda não consultado"}</dd>
            <dt>Última consulta SEI</dt>
            <dd>{formatDate(p.seiSyncedAt)}</dd>
          </dl>
          <p className="hint">
            Informações somente para leitura. Status externo não altera
            automaticamente o acompanhamento local.
          </p>
        </section>
        <section className="panel">
          <h2>Imóveis e interessados</h2>
          {p.properties.map((v) => (
            <p key={v.id}>
              <strong>{v.identifier || "Sem identificador"}</strong>{" "}
              <span className="badge neutral">{v.origin}</span>
              <br />
              {v.address}
            </p>
          ))}
          {p.parties.map((v) => (
            <p key={v.id}>
              {v.name}
              <small>
                {v.role} · {v.origin}
              </small>
            </p>
          ))}
          <hr />
          <h3>Observações locais</h3>
          <p>{p.notes ?? "Nenhuma observação registrada."}</p>
        </section>
      </div>
      {!p.closedAt && user.role !== "CONSULTA" && (
        <section className="panel">
          <h2>Registrar atividade</h2>
          <p>
            Registra trabalho de {user.name} em {p.unit.code}. Não altera a
            situação automaticamente.
          </p>
          <ActionForm
            url={url}
            values={{ ...values, action: "activity" }}
            label="Registrar atividade"
          >
            <div className="form-grid">
              <label>
                Categoria
                <select
                  name="category"
                  defaultValue={
                    user.role === "ADMINISTRATIVO"
                      ? "ADMINISTRATIVA"
                      : "TECNICA"
                  }
                >
                  <option
                    value="TECNICA"
                    disabled={user.role === "ADMINISTRATIVO"}
                  >
                    Técnica
                  </option>
                  <option value="ADMINISTRATIVA">Administrativa</option>
                </select>
              </label>
              <label>
                Tipo *
                <input
                  name="type"
                  required
                  placeholder="Ex.: Análise técnica"
                />
              </label>
              <label>
                Início (horário de Brasília) *
                <input type="datetime-local" name="startedAt" required />
              </label>
              <label>
                Término (se concluída)
                <input type="datetime-local" name="endedAt" />
              </label>
              <label className="full">
                Descrição *<textarea name="description" required />
              </label>
            </div>
          </ActionForm>
        </section>
      )}
      <section className="panel">
        <h2>Atividades do processo</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Atividade / autoria</th>
                <th>Unidade da atividade</th>
                <th>Início</th>
                <th>Término</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {p.activities.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.type}
                    <small>
                      {a.user.name} · {a.category}
                    </small>
                  </td>
                  <td>{a.unit.code}</td>
                  <td>{formatDate(a.startedAt)}</td>
                  <td>{a.endedAt ? formatDate(a.endedAt) : "Em andamento"}</td>
                  <td>
                    {!a.endedAt &&
                      !p.closedAt &&
                      (a.userId === user.id || canManage(user)) && (
                        <ActionForm
                          url={url}
                          values={{
                            ...values,
                            action: "finish",
                            activityId: a.id,
                          }}
                          label="Concluir"
                        />
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!p.activities.length && (
            <p className="empty">Nenhuma atividade iniciada.</p>
          )}
        </div>
      </section>
      {canManage(user) && (
        <section className="panel">
          <h2>Gestão do acompanhamento</h2>
          {!p.closedAt && (
            <>
              <details>
                <summary>Distribuir ou redistribuir</summary>
                <p>
                  Preserva o período anterior e a autoria das atividades
                  abertas; não inicia análise.
                </p>
                <ActionForm
                  url={url}
                  values={{ ...values, action: "assign" }}
                  label="Confirmar distribuição"
                >
                  <div className="form-grid">
                    <label>
                      Unidade destino
                      <select name="unitId" defaultValue={p.unitId}>
                        {units.map((u) => (
                          <option value={u.id} key={u.id}>
                            {u.code}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Responsável
                      <select name="userId">
                        {people.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Justificativa
                      <input name="reason" required />
                    </label>
                  </div>
                </ActionForm>
              </details>
              <details>
                <summary>Alterar situação local</summary>
                <ActionForm
                  url={url}
                  values={{ ...values, action: "status" }}
                  label="Alterar situação"
                >
                  <label>
                    Nova situação
                    <select name="status" defaultValue={p.status}>
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Justificativa
                    <input name="reason" required />
                  </label>
                </ActionForm>
              </details>
              <details>
                <summary>Editar complementação e prioridade</summary>
                <ActionForm
                  url={url}
                  values={{ ...values, action: "notes", priority: false }}
                >
                  <label>
                    Observações
                    <textarea name="notes" defaultValue={p.notes ?? ""} />
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      name="priority"
                      defaultChecked={p.priority}
                    />
                    Prioritário
                  </label>
                  <label>
                    Motivo da prioridade
                    <input
                      name="reason"
                      defaultValue={p.priorityReason ?? ""}
                    />
                  </label>
                </ActionForm>
              </details>
            </>
          )}
          <details>
            <summary>
              {p.closedAt ? "Reabrir" : "Encerrar"} acompanhamento
            </summary>
            <p>
              {p.closedAt
                ? "O processo voltará à carteira ativa."
                : "O processo sairá da carteira ativa. Atividades abertas precisam ser concluídas antes."}{" "}
              O histórico será preservado.
            </p>
            <ActionForm
              url={url}
              values={{ ...values, action: p.closedAt ? "reopen" : "close" }}
              label={
                p.closedAt ? "Confirmar reabertura" : "Confirmar encerramento"
              }
            >
              <label>
                Justificativa *<textarea name="reason" required />
              </label>
            </ActionForm>
          </details>
        </section>
      )}
      <div className="two-col">
        <section className="panel">
          <h2>Ofícios</h2>
          {p.letters.map((l) => (
            <p key={l.id}>
              <strong>{l.number}</strong> · {l.recipient}
              <small>
                {l.closedAt
                  ? "Encerrado"
                  : l.repliedAt
                    ? "Respondido"
                    : "Pendente de resposta"}
              </small>
            </p>
          ))}
          {!p.letters.length && <p>Nenhum ofício cadastrado.</p>}
          {!p.closedAt &&
            (canManage(user) || user.role === "ADMINISTRATIVO") && (
              <details>
                <summary>Cadastrar ofício</summary>
                <ActionForm url={url} values={{ ...values, action: "letter" }}>
                  <label>
                    Número / ano
                    <input name="number" required />
                  </label>
                  <label>
                    Destinatário
                    <input name="recipient" required />
                  </label>
                </ActionForm>
              </details>
            )}
        </section>
        <section className="panel">
          <h2>Arquivo físico</h2>
          {p.locations.map((l) => (
            <p key={l.id}>
              {l.location} · {l.volumes} volumes · {l.boxes} caixas
              <small>{formatDate(l.createdAt)}</small>
            </p>
          ))}
          {!p.locations.length && <p>Sem localização registrada.</p>}
          {!p.closedAt &&
            (canManage(user) || user.role === "ADMINISTRATIVO") && (
              <details>
                <summary>Registrar localização</summary>
                <ActionForm
                  url={url}
                  values={{ ...values, action: "location" }}
                >
                  <label>
                    Local / contêiner
                    <input name="location" required />
                  </label>
                  <label>
                    Volumes
                    <input
                      type="number"
                      name="volumes"
                      min="0"
                      defaultValue="0"
                      required
                    />
                  </label>
                  <label>
                    Caixas
                    <input
                      type="number"
                      name="boxes"
                      min="0"
                      defaultValue="0"
                      required
                    />
                  </label>
                </ActionForm>
              </details>
            )}
        </section>
      </div>
      {!p.closedAt && (canManage(user) || user.role === "ADMINISTRATIVO") && (
        <ComplementaryControls id={id} version={p.version} />
      )}
      <section className="panel">
        <h2>Histórico do processo</h2>
        <p>
          Ações operacionais e movimentações externas com origem identificada.
        </p>
        <ol className="timeline">
          {p.history.map((h) => (
            <li key={h.id}>
              <div>
                <strong>{h.kind}</strong>{" "}
                <span
                  className={`badge ${h.origin === "SEI" ? "blue" : "neutral"}`}
                >
                  {h.origin}
                </span>
                <small>
                  {formatDate(h.occurredAt)} · {h.author}
                </small>
              </div>
              <p>{h.description}</p>
              <small>Lançamento: {formatDate(h.recordedAt)}</small>
            </li>
          ))}
        </ol>
      </section>
    </Shell>
  );
}
