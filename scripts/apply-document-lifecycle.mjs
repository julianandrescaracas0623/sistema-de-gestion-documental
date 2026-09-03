/**
 * Aplica el ciclo de vida documental (docs/sql/document-lifecycle.sql):
 * columna documents.retention_until + índice. Idempotente.
 *
 * Run once: node scripts/apply-document-lifecycle.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import pkg from "@next/env";
import postgres from "postgres";

const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set (see .env.example)");
  process.exit(1);
}

const migrationSql = readFileSync(join(process.cwd(), "docs/sql/document-lifecycle.sql"), "utf8");
const sql = postgres(url, { max: 1 });

try {
  console.log("Aplicando ciclo de vida documental…");
  await sql.unsafe(migrationSql);
  const [col] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'retention_until'
    ) AS exists`;
  console.log(`✓ documents.retention_until: ${String(col?.exists)}`);
  console.log("Done.");
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await sql.end();
}
