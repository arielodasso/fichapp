import { Pool } from "pg";

const connectionString =
  process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "";

const globalForDb = globalThis as unknown as { __pool?: Pool };

export const pool =
  globalForDb.__pool ??
  new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pool = pool;
}
