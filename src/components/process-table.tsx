import Link from "next/link";
import { Prisma } from "@prisma/client";
import { formatDate } from "@/lib/domain";
type Row = Prisma.ProcessGetPayload<{
  include: {
    unit: true;
    assignments: { include: { user: true } };
    parties: true;
  };
}>;
export function ProcessTable({
  rows,
  back = "/processos",
}: {
  rows: Row[];
  back?: string;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Processo / interessado</th>
            <th>Assunto</th>
            <th>Unidade / técnico</th>
            <th>Acompanhamento</th>
            <th>Última ação local</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <Link
                  className="process-number"
                  href={`/processos/${p.id}?back=${encodeURIComponent(back)}`}
                >
                  {p.number}
                </Link>
                <small>
                  {p.parties[0]?.name ?? "Interessado não informado"}
                </small>
              </td>
              <td>
                {p.subject}
                {p.priority && (
                  <span
                    className="badge priority"
                    title={p.priorityReason ?? ""}
                  >
                    Prioritário
                  </span>
                )}
              </td>
              <td>
                <strong>{p.unit.code}</strong>
                <small>{p.assignments[0]?.user.name ?? "Não atribuído"}</small>
              </td>
              <td>
                <span
                  className={`badge ${p.closedAt ? "neutral" : p.status === "Em análise" ? "blue" : "amber"}`}
                >
                  {p.closedAt ? "Encerrado" : p.status}
                </span>
              </td>
              <td>{formatDate(p.lastOperationalAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="empty">
          Nenhum processo encontrado. Revise os filtros ou adicione um processo.
        </div>
      )}
    </div>
  );
}
