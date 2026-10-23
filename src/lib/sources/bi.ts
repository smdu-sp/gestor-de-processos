// SQL Server externo, schema introspectado em prisma/bi/schema.prisma.
// A view Processos tem 1,4 milhão de registros, sem unidade de distribuição.
// A importação depende da regra de seleção da carteira e correspondência de unidades.
export async function fetchBiDatabase(): Promise<unknown> {
  throw new Error(
    "Schema BI SQL Server disponível. Defina o escopo de processos da carteira e o mapeamento de unidades antes de habilitar a importação; a view Processos contém aproximadamente 1,4 milhão de registros.",
  );
}
