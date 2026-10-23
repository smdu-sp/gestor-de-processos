import { redirect } from "next/navigation";
import { currentUser, canManage } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import { ActionForm } from "@/components/widgets";
export default async function NewProcess() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!canManage(user)) redirect("/processos");
  const units = await db.unit.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : { memberships: { some: { userId: user.id } } },
  });
  return (
    <Shell user={user} active="Processos">
      <div className="page-heading">
        <div>
          <h1>Adicionar processo</h1>
          <p>
            Cadastro manual. O vínculo posterior ao BI preservará o histórico
            operacional.
          </p>
        </div>
      </div>
      <section className="panel narrow">
        <ActionForm
          url="/api/processes"
          label="Criar processo"
          onSuccess="detail"
        >
          <div className="form-grid">
            <label>
              Número do processo *<input name="number" required minLength={5} />
            </label>
            <label>
              Sistema
              <select name="system">
                <option>SEI</option>
                <option>AD</option>
                <option>FISICO</option>
              </select>
            </label>
            <label>
              Assunto *<input name="subject" required minLength={3} />
            </label>
            <label>
              Unidade *
              <select name="unitId">
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              SQL / INCRA
              <input name="identifier" />
            </label>
            <label>
              Endereço
              <input name="address" />
            </label>
            <label>
              Interessado
              <input name="party" />
            </label>
          </div>
        </ActionForm>
      </section>
    </Shell>
  );
}
