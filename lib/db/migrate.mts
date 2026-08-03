import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "schema.sql");

const connectionString =
  process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "";

if (!connectionString) {
  console.error(
    "Faltan las variables POSTGRES_URL o DATABASE_URL para conectar a la base de datos"
  );
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function main() {
  const schema = readFileSync(schemaPath, "utf8");
  await client.connect();
  try {
    await client.query(schema);
    console.log("Migración aplicada correctamente");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Error al aplicar la migración:", err);
  process.exit(1);
});
