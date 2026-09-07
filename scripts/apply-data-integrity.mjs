/**
 * Aplica integridad de datos (docs/sql/data-integrity.sql): constraints
 * únicos (categories.name case-insensitive, user_roles.user_id) + RPCs
 * transaccionales create_role_with_permissions / update_role_with_permissions
 * / sync_document_tags. Idempotente.
 *
 * Depende de: apply-rbac-granular.mjs (RLS de roles/role_permissions/tags).
 *
 * Run once: node scripts/apply-data-integrity.mjs
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

const migrationSql = readFileSync(join(process.cwd(), "docs/sql/data-integrity.sql"), "utf8");
const sql = postgres(url, { max: 1 });

try {
  const dupes = await sql`
    SELECT lower(name) AS name, count(*)::int AS n
    FROM public.categories
    GROUP BY lower(name)
    HAVING count(*) > 1`;
  if (dupes.length > 0) {
    console.error(
      `✗ Hay ${String(dupes.length)} nombre(s) de categoría duplicados (sin distinguir mayúsculas): ` +
        `${dupes.map((d) => d.name).join(", ")}. Renómbralos antes de aplicar el índice único.`
    );
    process.exit(1);
  }

  console.log("Aplicando integridad de datos…");
  await sql.unsafe(migrationSql);

  const [catIdx] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'categories_name_lower_idx'
    ) AS exists`;
  const [urConstraint] = await sql`
    SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_unique') AS exists`;
  const [fns] = await sql`
    SELECT count(*)::int AS n FROM pg_proc
    WHERE proname IN ('create_role_with_permissions', 'update_role_with_permissions', 'sync_document_tags')`;
  console.log(
    `✓ categories_name_lower_idx: ${String(catIdx?.exists)} · user_roles_user_id_unique: ` +
      `${String(urConstraint?.exists)} · RPCs instaladas: ${String(fns?.n)}/3`
  );
  console.log("Done.");
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await sql.end();
}
