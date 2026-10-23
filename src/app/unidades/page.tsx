import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import { ActionForm } from "@/components/widgets";
export const dynamic = "force-dynamic";
function NameFields({ code, name }: { code?: string; name?: string }) {
  return (
    <div className="form-grid">
      <label>
        Sigla *
        <input
          name="code"
          defaultValue={code}
          required
          minLength={2}
          maxLength={30}
        />
      </label>
      <label>
        Nome *
        <input
          name="name"
          defaultValue={name}
          required
          minLength={3}
          maxLength={150}
        />
      </label>
    </div>
  );
}
export default async function Structure() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  const coordinations = await db.coordination.findMany({
    orderBy: { code: "asc" },
    include: {
      divisions: {
        orderBy: { code: "asc" },
        include: {
          _count: {
            select: {
              staff: { where: { active: true } },
              processes: { where: { closedAt: null } },
            },
          },
        },
      },
    },
  });
  return (
    <Shell user={user} active="Coordenadorias e divisões">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ADMINISTRAÇÃO</div>
          <h1>Coordenadorias e divisões</h1>
          <p>
            Cada coordenadoria reúne uma ou mais divisões. Processos e
            servidores são lotados nas divisões.
          </p>
        </div>
      </div>
      <div className="two-col">
        <section className="panel">
          <h2>Nova coordenadoria</h2>
          <ActionForm
            url="/api/structure"
            values={{ kind: "coordination" }}
            label="Criar coordenadoria"
          >
            <NameFields />
          </ActionForm>
        </section>
        <section className="panel">
          <h2>Nova divisão</h2>
          {coordinations.length ? (
            <ActionForm
              url="/api/structure"
              values={{ kind: "division" }}
              label="Criar divisão"
            >
              <label>
                Coordenadoria *
                <select name="coordinationId" required>
                  {coordinations.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} · {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <NameFields />
            </ActionForm>
          ) : (
            <p className="empty">Cadastre primeiro uma coordenadoria.</p>
          )}
        </section>
      </div>
      {coordinations.map((c) => (
        <section className="panel table-wrap" key={c.id}>
          <div className="section-heading">
            <div>
              <h2>
                {c.code} · {c.name}
              </h2>
              {!c.divisions.length && (
                <p className="warning">
                  Sem divisões: cadastre ao menos uma para lotar servidores.
                </p>
              )}
            </div>
            <details>
              <summary>Editar coordenadoria</summary>
              <ActionForm
                url="/api/structure"
                values={{ kind: "coordination", id: c.id }}
              >
                <NameFields code={c.code} name={c.name} />
              </ActionForm>
            </details>
          </div>
          {c.divisions.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Divisão</th>
                  <th>Servidores ativos</th>
                  <th>Processos ativos</th>
                  <th>Editar</th>
                </tr>
              </thead>
              <tbody>
                {c.divisions.map((d) => (
                  <tr key={d.id}>
                    <td>
                      {d.code}
                      <small>{d.name}</small>
                    </td>
                    <td>{d._count.staff}</td>
                    <td>{d._count.processes}</td>
                    <td>
                      <details>
                        <summary>Alterar</summary>
                        <ActionForm
                          url="/api/structure"
                          values={{ kind: "division", id: d.id }}
                        >
                          <label>
                            Coordenadoria
                            <select name="coordinationId" defaultValue={c.id}>
                              {coordinations.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.code}
                                </option>
                              ))}
                            </select>
                          </label>
                          <NameFields code={d.code} name={d.name} />
                        </ActionForm>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </Shell>
  );
}
