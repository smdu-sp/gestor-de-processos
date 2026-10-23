import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { processFilter } from "@/lib/queries";
import { csvCell, formatDate } from "@/lib/domain";
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return new Response("Não autorizado", { status: 401 });
  const filters = Object.fromEntries(req.nextUrl.searchParams);
  const processes = await db.process.findMany({
    where: processFilter(user, filters),
    include: {
      unit: true,
      assignments: { where: { endedAt: null }, include: { user: true } },
    },
    orderBy: { number: "asc" },
  });
  const rows = [
    ["Referência", formatDate(new Date())],
    ["Filtros", JSON.stringify(filters)],
    [
      "Processo",
      "Assunto",
      "Unidade",
      "Técnico",
      "Situação",
      "Prioritário",
      "Última movimentação operacional",
    ],
    ...processes.map((p) => [
      p.number,
      p.subject,
      p.unit.code,
      p.assignments[0]?.user.name,
      p.status,
      p.priority ? "Sim" : "Não",
      formatDate(p.lastOperationalAt),
    ]),
  ];
  return new Response(
    "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n"),
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="processos.csv"',
        "Cache-Control": "no-store",
      },
    },
  );
}
