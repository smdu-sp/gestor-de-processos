require("dotenv").config({ quiet: true });
const sql = require("mssql");
const fs = require("node:fs");
async function main() {
  const raw = process.env.BI_DATABASE_URL;
  if (!raw?.startsWith("sqlserver://"))
    throw new Error("Configure BI_DATABASE_URL SQL Server.");
  const parts = raw.slice(12).split(";");
  const authority = parts.shift();
  const values = Object.fromEntries(
    parts.filter(Boolean).map((part) => {
      const i = part.indexOf("=");
      return [part.slice(0, i).toLowerCase(), part.slice(i + 1)];
    }),
  );
  const [server, port] = authority.split(":");
  const pool = await new sql.ConnectionPool({
    server,
    port: Number(port || 1433),
    database: values.database,
    user: values.user || values.username,
    password: values.password,
    options: {
      encrypt: true,
      trustServerCertificate: process.argv.includes(
        "--trust-server-certificate",
      ),
      readOnlyIntent: true,
    },
    pool: { max: 1, min: 0 },
    requestTimeout: 30000,
    connectionTimeout: 15000,
  }).connect();
  try {
    const objects = (
      await pool
        .request()
        .query(
          "SELECT s.name AS schema_name,o.name,o.type_desc FROM sys.objects o JOIN sys.schemas s ON s.schema_id=o.schema_id WHERE o.type IN ('U','V') AND o.is_ms_shipped=0 ORDER BY s.name,o.name",
        )
    ).recordset;
    const columns = (
      await pool
        .request()
        .query(
          "SELECT TABLE_SCHEMA,TABLE_NAME,COLUMN_NAME,DATA_TYPE,IS_NULLABLE,CHARACTER_MAXIMUM_LENGTH,NUMERIC_PRECISION,NUMERIC_SCALE FROM INFORMATION_SCHEMA.COLUMNS ORDER BY TABLE_SCHEMA,TABLE_NAME,ORDINAL_POSITION",
        )
    ).recordset;
    const profile = (
      await pool
        .request()
        .query(
          "SELECT COUNT_BIG(*) AS total, COUNT(DISTINCT CONCAT(COD_UNID_PCSS_SEI,'/',ANO_AUTC_PCSS,'/',COD_NRO_PCSS,'/',COD_DIGI_PCSS)) AS process_keys, SUM(CASE WHEN COD_UNID_PCSS_SEI IS NULL OR ANO_AUTC_PCSS IS NULL OR COD_NRO_PCSS IS NULL OR COD_DIGI_PCSS IS NULL THEN 1 ELSE 0 END) AS missing_keys, MIN(DT_ATLZ) AS min_updated,MAX(DT_ATLZ) AS max_updated FROM dbo.bronze_sd0261_T10345_CONS_OLHO_OBRA",
        )
    ).recordset;
    const systems = (
      await pool
        .request()
        .query(
          "SELECT COD_IDT_SIST,COUNT_BIG(*) AS rows FROM dbo.bronze_sd0261_T10345_CONS_OLHO_OBRA GROUP BY COD_IDT_SIST",
        )
    ).recordset;
    const lengths = (
      await pool
        .request()
        .query(
          "SELECT MIN(LEN(CONVERT(varchar(30),COD_NRO_PCSS))) min_number_length,MAX(LEN(CONVERT(varchar(30),COD_NRO_PCSS))) max_number_length,MIN(LEN(CONVERT(varchar(30),COD_SQL))) min_sql_length,MAX(LEN(CONVERT(varchar(30),COD_SQL))) max_sql_length FROM dbo.bronze_sd0261_T10345_CONS_OLHO_OBRA",
        )
    ).recordset;
    const definitions = (
      await pool
        .request()
        .query(
          "SELECT o.name,OBJECT_DEFINITION(o.object_id) AS definition FROM sys.views o WHERE o.name IN ('Processos','prata_processo','Assuntos','Interessados','Enderecos','Cadastros')",
        )
    ).recordset;
    const viewProfile = (
      await pool
        .request()
        .query(
          "SELECT COUNT_BIG(*) total, COUNT(DISTINCT CONCAT(Sistema,'|',Processo)) natural_keys,COUNT(DISTINCT id_processo) ids, SUM(CASE WHEN Processo IS NULL OR Sistema IS NULL THEN 1 ELSE 0 END) missing_keys FROM dbo.Processos",
        )
    ).recordset;
    fs.writeFileSync(
      "docs/bi-inspecao.json",
      JSON.stringify(
        {
          inspectedAt: new Date().toISOString(),
          objects,
          columns,
          profile,
          systems,
          lengths,
          definitions,
          viewProfile,
        },
        null,
        2,
      ),
    );
    console.log(JSON.stringify({ viewProfile, definitions }, null, 2));
  } finally {
    await pool.close();
  }
}
main().catch(() => {
  console.error(
    "Falha na inspeção BI. Credenciais e detalhes da conexão omitidos.",
  );
  process.exitCode = 1;
});
