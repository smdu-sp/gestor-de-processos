import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser, unitScope } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import { formatDate } from "@/lib/domain";
export default async function Auxiliary({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { section } = await params;
  const names: Record<string, string> = {
    atividades: "Minhas atividades",
    grupos: "Grupos",
    oficios: "Ofícios",
    arquivo: "Arquivo físico",
  };
  const title = names[section];
  if (!title) notFound();
  const scope = unitScope(user);
  let content: React.ReactNode;
  if (section === "atividades") {
    const rows = await db.activity.findMany({
      where: { userId: user.id, ...scope },
      include: { process: true, unit: true },
      orderBy: { startedAt: "desc" },
      take: 100,
    });
    content = (
      <table>
        <thead>
          <tr>
            <th>Processo</th>
            <th>Atividade</th>
            <th>Unidade</th>
            <th>Início</th>
            <th>Término</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td>
                <Link href={`/processos/${a.processId}`}>
                  {a.process.number}
                </Link>
              </td>
              <td>{a.type}</td>
              <td>{a.unit.code}</td>
              <td>{formatDate(a.startedAt)}</td>
              <td>{a.endedAt ? formatDate(a.endedAt) : "Em andamento"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  } else if (section === "grupos") {
    const rows = await db.group.findMany({
      include: {
        _count: { select: { processes: { where: { process: scope } } } },
      },
    });
    content = (
      <div className="group-grid">
        {rows.map((g) => (
          <Link
            className="group-card"
            key={g.id}
            href={`/processos?group=${g.id}`}
          >
            <h2>{g.name}</h2>
            <p>{g._count.processes} processos vinculados</p>
            <span>Consultar carteira →</span>
          </Link>
        ))}
      </div>
    );
  } else if (section === "oficios") {
    const rows = await db.letter.findMany({
      where: { process: scope },
      include: { process: true },
      take: 100,
      orderBy: { number: "desc" },
    });
    content = (
      <table>
        <thead>
          <tr>
            <th>Ofício</th>
            <th>Processo</th>
            <th>Destinatário</th>
            <th>Envio</th>
            <th>Resposta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id}>
              <td>{l.number}</td>
              <td>
                <Link href={`/processos/${l.processId}`}>
                  {l.process.number}
                </Link>
              </td>
              <td>{l.recipient}</td>
              <td>{formatDate(l.sentAt)}</td>
              <td>{formatDate(l.repliedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  } else {
    const rows = await db.process.findMany({
      where: { ...scope, locations: { some: {} } },
      include: { locations: { orderBy: { createdAt: "desc" }, take: 1 } },
      take: 100,
    });
    content = (
      <table>
        <thead>
          <tr>
            <th>Processo</th>
            <th>Localização atual</th>
            <th>Volumes</th>
            <th>Caixas</th>
            <th>Registro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/processos/${p.id}`}>{p.number}</Link>
              </td>
              <td>{p.locations[0].location}</td>
              <td>{p.locations[0].volumes}</td>
              <td>{p.locations[0].boxes}</td>
              <td>{formatDate(p.locations[0].createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return (
    <Shell user={user} active={title}>
      <div className="page-heading">
        <div>
          <div className="eyebrow">GESTÃO OPERACIONAL</div>
          <h1>{title}</h1>
          <p>
            {section === "grupos"
              ? "Acompanhamentos temáticos sobre o cadastro central."
              : "Até 100 registros recentes, respeitando o acesso às unidades. Consulte a ficha do processo para registrar alterações."}
          </p>
        </div>
      </div>
      <section className="panel table-wrap">{content}</section>
    </Shell>
  );
}
