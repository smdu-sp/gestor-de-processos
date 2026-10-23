import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { currentUser, canManage } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import { ActionForm } from "@/components/widgets";
import { StaffForm } from "@/components/staff-form";
import { roleLabels, roles } from "@/lib/staff";
export const dynamic = "force-dynamic";
export default async function Staff({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!canManage(user)) redirect("/");
  const s = await searchParams;
  const isAdmin = user.role === "ADMIN";
  const divisions = await db.unit.findMany({
    where: isAdmin ? {} : { memberships: { some: { userId: user.id } } },
    include: { coordination: true },
    orderBy: [{ coordination: { code: "asc" } }, { code: "asc" }],
  });
  const allowed = divisions.map((d) => d.id);
  const AND: Prisma.UserWhereInput[] = [
    // Gestor vê sua coordenadoria e os cadastros pendentes (sem lotação).
    isAdmin ? {} : { OR: [{ unitId: { in: allowed } }, { unitId: null }] },
  ];
  if (s.q?.trim())
    AND.push({
      OR: [
        { name: { contains: s.q.trim() } },
        { rf: { contains: s.q.trim() } },
        { email: { contains: s.q.trim() } },
      ],
    });
  if (s.unit) AND.push({ unitId: s.unit });
  if (s.situation === "active") AND.push({ active: true });
  if (s.situation === "inactive") AND.push({ active: false });
  if (s.situation === "pending") AND.push({ unitId: null });
  const staff = await db.user.findMany({
    where: { AND },
    include: { unit: { include: { coordination: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    take: 300,
  });
  const grouped = Object.values(
    divisions.reduce<
      Record<
        string,
        { coordination: string; units: { id: string; label: string }[] }
      >
    >((acc, d) => {
      acc[d.coordinationId] ??= {
        coordination: `${d.coordination.code} · ${d.coordination.name}`,
        units: [],
      };
      acc[d.coordinationId].units.push({
        id: d.id,
        label: `${d.code} · ${d.name}`,
      });
      return acc;
    }, {}),
  );
  const roleOptions = roles
    .filter((r) => isAdmin || r !== "ADMIN")
    .map((r) => ({ id: r, label: roleLabels[r] }));
  return (
    <Shell user={user} active="Servidores">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ADMINISTRAÇÃO</div>
          <h1>Servidores</h1>
          <p>
            Cadastro pelo login de rede (LDAP). Cada servidor fica lotado em uma
            divisão; gestores acessam toda a coordenadoria da sua divisão.
          </p>
        </div>
      </div>
      <section className="panel narrow">
        <h2>Adicionar servidor</h2>
        <StaffForm divisions={grouped} roles={roleOptions} />
      </section>
      <section className="panel">
        <form className="filters">
          <label className="search-field">
            Buscar servidor
            <input
              name="q"
              defaultValue={s.q}
              placeholder="Nome, login ou e-mail"
            />
          </label>
          <label>
            Divisão
            <select name="unit" defaultValue={s.unit}>
              <option value="">Todas</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.coordination.code} / {d.code}
                </option>
              ))}
            </select>
          </label>
          <label>
            Situação
            <select name="situation" defaultValue={s.situation}>
              <option value="">Todas</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="pending">Sem lotação</option>
            </select>
          </label>
          <button>Aplicar filtros</button>
        </form>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Servidor</th>
                <th>Login</th>
                <th>Lotação</th>
                <th>Perfil</th>
                <th>Situação</th>
                <th>Editar</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => {
                const locked = !isAdmin && u.role === "ADMIN";
                return (
                  <tr key={u.id}>
                    <td>
                      {u.name}
                      {u.email && <small>{u.email}</small>}
                    </td>
                    <td>{u.rf}</td>
                    <td>
                      {u.unit ? (
                        <>
                          {u.unit.code}
                          <small>{u.unit.coordination.code}</small>
                        </>
                      ) : (
                        <span className="badge amber">Sem lotação</span>
                      )}
                    </td>
                    <td>{roleLabels[u.role] ?? u.role}</td>
                    <td>
                      <span
                        className={`badge ${u.active ? "blue" : "neutral"}`}
                      >
                        {u.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      {locked ? (
                        <small>Somente administradores</small>
                      ) : (
                        <details>
                          <summary>Alterar</summary>
                          <ActionForm url="/api/staff" values={{ id: u.id }}>
                            <label>
                              Divisão
                              <select
                                name="unitId"
                                defaultValue={u.unitId ?? ""}
                                required
                              >
                                <option value="" disabled>
                                  Selecione
                                </option>
                                {divisions.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.coordination.code} / {d.code}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Perfil
                              <select name="role" defaultValue={u.role}>
                                {roleOptions.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="check">
                              <input
                                type="checkbox"
                                name="active"
                                defaultChecked={u.active}
                              />
                              Acesso ativo
                            </label>
                          </ActionForm>
                        </details>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!staff.length && (
            <p className="empty">Nenhum servidor encontrado.</p>
          )}
        </div>
      </section>
    </Shell>
  );
}
