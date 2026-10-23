const fs = require("node:fs");
const { randomBytes } = require("node:crypto");
require("dotenv").config({ quiet: true });
let content = fs.readFileSync(".env", "utf8");
const values = {
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || "gestao_processos",
  MYSQL_USER: process.env.MYSQL_USER || "gestao",
  MYSQL_PORT: process.env.MYSQL_PORT || "3307",
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || randomBytes(24).toString("hex"),
  MYSQL_ROOT_PASSWORD:
    process.env.MYSQL_ROOT_PASSWORD || randomBytes(32).toString("hex"),
};
const url = `mysql://${encodeURIComponent(values.MYSQL_USER)}:${encodeURIComponent(values.MYSQL_PASSWORD)}@127.0.0.1:${values.MYSQL_PORT}/${values.MYSQL_DATABASE}`;
for (const [key, value] of Object.entries({ ...values, DATABASE_URL: url })) {
  const line = `${key}=${JSON.stringify(value)}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  content = pattern.test(content)
    ? content.replace(pattern, () => line)
    : content + "\n" + line + "\n";
}
fs.writeFileSync(".env", content);
console.log("MySQL configurado no .env. Credenciais omitidas.");
