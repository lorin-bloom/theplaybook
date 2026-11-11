/**
 * Database access. Production uses PostgreSQL via DATABASE_URL (node-postgres).
 * Local development and tests use PGlite — real Postgres compiled to WASM —
 * so the app runs with zero external services while keeping one SQL dialect.
 */
import path from "node:path";
import fs from "node:fs";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

type Holder = { db?: Promise<DB> };
const g = globalThis as unknown as { __gtmDb?: Holder };
g.__gtmDb ??= {};

const MIGRATIONS = path.join(process.cwd(), "drizzle");

async function create(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url && /^postgres(ql)?:\/\//.test(url)) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    // Small pool: serverless instances are many and short-lived (use Neon's pooled URL).
    const pool = new Pool({ connectionString: url, max: 3 });
    const db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    return db;
  }
  if (process.env.VERCEL) {
    // Serverless filesystems are ephemeral: an embedded database would silently lose every playbook.
    throw new Error("DATABASE_URL must be set to a Postgres connection string in production (e.g. Neon via the Vercel Marketplace).");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  let client;
  if (dir === "memory") {
    client = new PGlite();
  } else {
    fs.mkdirSync(dir, { recursive: true });
    client = new PGlite(dir);
  }
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return db as unknown as DB;
}

export function getDb(): Promise<DB> {
  g.__gtmDb!.db ??= create().catch((err) => {
    g.__gtmDb!.db = undefined;
    throw err;
  });
  return g.__gtmDb!.db;
}

/** Test helper: drop the cached connection so a fresh in-memory DB is created. */
export function resetDbForTests() {
  g.__gtmDb!.db = undefined;
}

export { schema };
