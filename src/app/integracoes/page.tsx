import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import { ActionForm } from "@/components/widgets";
import { formatDate } from "@/lib/domain";
export default async function Integrations() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  const runs = await db.syncRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 30,
  });
  return (
    <Shell user={user} active="Integrações">
      <div className="page-heading">
        <div>
          <div className="eyebrow">FONTES EXTERNAS · SOMENTE LEITURA</div>
          <h1>Integrações</h1>
          <p>
            Atualização dos dados de origem com preservação da gestão local.
          </p>
        </div>
      </div>
      <div className="two-col">
        {(["BI", "SEI"] as const).map((source) => (
          <section className="panel" key={source}>
            <span className="badge amber">
              {source === "BI"
                ? "SQL Server · schema identificado"
                : process.env.SEI_WSDL_URL
                  ? "WSDL informado · homologação pendente"
                  : "WSDL não configurado"}
            </span>
            <h2>
              {source === "BI"
                ? "BI · Banco de dados"
                : "SEI · Web Services SOAP 4.1"}
            </h2>
            <p>
              {source === "BI"
                ? "Incorpora e atualiza dados cadastrais. Não sobrescreve distribuição, prioridade ou observações."
                : "Consulta status e importa eventos identificados. Não inicia nem conclui atividades técnicas."}
            </p>
            <p className="hint">
              {source === "BI"
                ? "Schema identificado: processos, assuntos, interessados e endereços. Importação depende do escopo da carteira e do mapeamento de unidades."
                : "Consulta unidades abertas e marcos do processo. Histórico adicional exige IDs oficiais de tarefas; sem filtros, não representa todo o histórico. Configuração e respostas precisam ser homologadas na instalação."}
            </p>
            <ActionForm
              url="/api/sync"
              values={{ source }}
              label={`Sincronizar ${source}`}
            />
          </section>
        ))}
      </div>
      <section className="panel">
        <h2>Execuções recentes</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fonte</th>
                <th>Início</th>
                <th>Resultado</th>
                <th>Registros</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td>{r.source}</td>
                  <td>{formatDate(r.startedAt)}</td>
                  <td>
                    <span
                      className={`badge ${r.status === "SUCCESS" ? "blue" : "amber"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>{r.processed}</td>
                  <td>{r.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!runs.length && (
            <p className="empty">
              Nenhuma sincronização executada. Configure as fontes no servidor.
            </p>
          )}
        </div>
      </section>
      <section className="panel">
        <h2>Execução em segundo plano</h2>
        <p>
          O comando <code>npm run sync</code> pode ser executado pelo agendador
          do servidor. A frequência deve acompanhar a atualização das fontes.
          Lotes com conflitos são revertidos e ficam registrados para revisão.
        </p>
      </section>
    </Shell>
  );
}
