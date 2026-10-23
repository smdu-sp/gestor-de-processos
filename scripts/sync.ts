import "dotenv/config";
import { synchronize } from "../src/lib/integrations";
import { db } from "../src/lib/db";
async function main() {
  const selected = process.argv[2]?.toUpperCase();
  if (selected && selected !== "BI" && selected !== "SEI")
    throw new Error("Uso: npm run sync -- BI ou npm run sync -- SEI");
  const sources: ("BI" | "SEI")[] =
    selected === "BI" || selected === "SEI" ? [selected] : ["BI", "SEI"];
  for (const source of sources) {
    try {
      console.log(source, await synchronize(source));
    } catch (error) {
      console.error(
        source,
        error instanceof Error ? error.message : "Falha de sincronização.",
      );
      process.exitCode = 1;
    }
  }
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
