require("dotenv").config({ quiet: true });
const url = process.env.DATABASE_URL;
if (!url)
  throw new Error("Copie .env.example para .env e configure DATABASE_URL.");
if (!url.startsWith("mysql://"))
  throw new Error("O banco operacional requer DATABASE_URL MySQL.");
