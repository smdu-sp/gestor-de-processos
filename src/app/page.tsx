import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, unitScope } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import { ProcessTable } from "@/components/process-table";
import {
  ArrowUpRight,
  FolderOpen,
  Flag,
  UsersRound,
  CircleCheck,
} from "lucide-react";
export const dynamic = "force-dynamic";
export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const scope = unitScope(user);
  const [active, priority, unassigned, completed, rows, units] =
    await Promise.all([
      db.process.count({ where: { ...scope, closedAt: null } }),
      db.process.count({ where: { ...scope, closedAt: null, priority: true } }),
      db.process.count({
        where: {
          ...scope,
          closedAt: null,
          assignments: { none: { endedAt: null } },
        },
      }),
      db.activity.count({
        where: {
          ...scope,
          endedAt: { gte: new Date(Date.now() - 30 * 86400000) },
        },
      }),
      db.process.findMany({
        where: { ...scope, closedAt: null },
        include: {
          unit: true,
          parties: true,
          assignments: { where: { endedAt: null }, include: { user: true } },
        },
        orderBy: [{ priority: "desc" }, { lastOperationalAt: "asc" }],
        take: 6,
      }),
      db.unit.findMany({
        where:
          user.role === "ADMIN"
            ? {}
            : { memberships: { some: { userId: user.id } } },
        include: {
          _count: {
            select: {
              processes: { where: { closedAt: null } },
              activities: {
                where: {
                  endedAt: { gte: new Date(Date.now() - 30 * 86400000) },
                },
              },
            },
          },
        },
      }),
    ]);
  const cards = [
    ["Processos ativos", active, "/processos", FolderOpen],
    ["Prioritários", priority, "/processos?priority=true", Flag],
    ["Sem distribuição", unassigned, "/processos?unassigned=true", UsersRound],
    ["Atividades concluídas · 30 dias", completed, "/relatorios", CircleCheck],
  ] as const;
  return (
    <Shell user={user} active="Visão geral">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ACOMPANHAMENTO OPERACIONAL</div>
          <h1>Visão geral</h1>
          <p>Carteira e produção das unidades sob sua gestão.</p>
        </div>
        <Link className="button" href="/processos/novo">
          + Adicionar processo
        </Link>
      </div>
      <div className="stats">
        {cards.map(([label, value, href, Icon]) => (
          <Link href={href} className="stat" key={label}>
            <div>
              <span>{label}</span>
              <Icon size={19} />
            </div>
            <strong>{value}</strong>
            <small>
              Consultar registros <ArrowUpRight size={14} />
            </small>
          </Link>
        ))}
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Carteira por unidade</h2>
              <p>
                Processos ativos e atividades concluídas nos últimos 30 dias
              </p>
            </div>
          </div>
          {units.map((u) => (
            <Link
              href={`/processos?unit=${u.id}`}
              className="unit-row"
              key={u.id}
            >
              <div>
                <strong>{u.code}</strong>
                <small>{u.name}</small>
              </div>
              <div className="bar-track">
                <span
                  style={{
                    width: `${Math.max(3, (u._count.processes / Math.max(active, 1)) * 100)}%`,
                  }}
                />
              </div>
              <strong>{u._count.processes}</strong>
              <small>{u._count.activities} concluídas</small>
            </Link>
          ))}
        </section>
        <section className="panel callout">
          <div className="eyebrow">DADOS COM CONTEXTO</div>
          <h2>Responsabilidade e produção são medidas distintas.</h2>
          <p>
            A carteira mostra quem acompanha cada processo. A produção considera
            as atividades, a autoria e a unidade no momento do trabalho.
          </p>
          <Link href="/relatorios">Explorar indicadores →</Link>
          <hr />
          <small>
            Movimentações do SEI compõem o histórico e não contam
            automaticamente como produção técnica.
          </small>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Processos em acompanhamento</h2>
            <p>
              Prioritários primeiro, seguidos pelos registros há mais tempo sem
              ação local
            </p>
          </div>
          <Link href="/processos">Ver carteira completa →</Link>
        </div>
        <ProcessTable rows={rows} />
      </section>
    </Shell>
  );
}
