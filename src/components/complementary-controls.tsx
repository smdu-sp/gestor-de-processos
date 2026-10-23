import { db } from "@/lib/db";
import { ActionForm } from "./widgets";
export async function ComplementaryControls({
  id,
  version,
}: {
  id: string;
  version: number;
}) {
  const [groups, links, letters] = await Promise.all([
    db.group.findMany(),
    db.processGroup.findMany({
      where: { processId: id },
      include: { group: true },
    }),
    db.letter.findMany({ where: { processId: id, closedAt: null } }),
  ]);
  return (
    <section className="panel">
      <h2>Grupos e andamento de ofícios</h2>
      <p>
        Grupos atuais: {links.map((l) => l.group.name).join(", ") || "Nenhum"}
      </p>
      <details>
        <summary>Vincular a um grupo</summary>
        <ActionForm
          url={`/api/processes/${id}`}
          values={{ version, action: "group" }}
          label="Vincular grupo"
        >
          <label>
            Grupo
            <select name="groupId">
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        </ActionForm>
      </details>
      {letters.map((l) => (
        <details key={l.id}>
          <summary>Atualizar ofício {l.number}</summary>
          <p>
            Registra a ocorrência na data atual. O envio deve ser realizado no
            sistema oficial.
          </p>
          <ActionForm
            url={`/api/processes/${id}`}
            values={{ version, action: "letterStatus", letterId: l.id }}
            label="Registrar andamento"
          >
            <label>
              Etapa
              <select name="stage">
                {!l.sentAt && <option value="sent">Registrar envio</option>}
                {l.sentAt && !l.repliedAt && (
                  <option value="replied">Registrar resposta</option>
                )}
                <option value="closed">Encerrar ofício</option>
              </select>
            </label>
          </ActionForm>
        </details>
      ))}
    </section>
  );
}
