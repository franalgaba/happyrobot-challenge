import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSqlClient } from "./client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations");
}

const migrationsDir = new URL("../../drizzle", import.meta.url);
const sql = createSqlClient(databaseUrl);

async function ensureMigrationTable() {
  await sql`CREATE TABLE IF NOT EXISTS __migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`;
}

async function migrationFiles() {
  return (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
}

async function migrationExists(file: string) {
  const [migration] = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (SELECT 1 FROM __migrations WHERE name = ${file}) AS exists
  `;
  return Boolean(migration?.exists);
}

async function applyMigration(file: string) {
  const migrationSql = await readFile(join(migrationsDir.pathname, file), "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(migrationSql);
    await tx`INSERT INTO __migrations (name) VALUES (${file})`;
  });
  console.log(`Applied migration ${file}`);
}

try {
  await ensureMigrationTable();

  for (const file of await migrationFiles()) {
    if (await migrationExists(file)) {
      continue;
    }

    await applyMigration(file);
  }
} finally {
  await sql.end();
}
