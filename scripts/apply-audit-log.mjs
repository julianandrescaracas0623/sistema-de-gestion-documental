/**
 * Aplica la bitácora de auditoría (docs/sql/audit-log.sql): tabla append-only
 * public.audit_log, RPC public.record_audit(), permiso audit.read y
 * profiles.last_login_at. Idempotente.
 *
 * Depende de: apply-rbac-granular.mjs (usa public.has_permission).
 *
 * Run once: node scripts/apply-audit-log.mjs
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

const migrationSql = readFileSync(join(process.cwd(), "docs/sql/audit-log.sql"), "utf8");
const sql = postgres(url, { max: 1 });

try {
  const [fn] = await sql`SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_permission') AS exists`;
  if (!fn?.exists) {
    console.error("public.has_permission no existe. Ejecuta antes: node scripts/apply-rbac-migration.mjs");
    process.exit(1);
  }

  console.log("Aplicando bitácora de auditoría…");
  await sql.unsafe(migrationSql);

  const [{ count: rows }] = await sql`SELECT count(*)::int AS count FROM public.audit_log`;
  const [perm] = await sql`SELECT EXISTS (SELECT 1 FROM public.permissions WHERE key = 'audit.read') AS exists`;
  console.log(`✓ audit_log listo (${rows} filas) · permiso audit.read: ${String(perm?.exists)}`);
  console.log("Done.");
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await sql.end();
}
