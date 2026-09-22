/**
 * Applies the documents.download permission migration
 * (docs/sql/documents-download-permission.sql): adds a "download" permission
 * key distinct from "read" so a view-only role can't download documents, and
 * grants it to the "admin" role.
 *
 * Depends on: apply-rbac-migration.mjs having run first (needs the
 * `permissions`, `roles`, `role_permissions` tables).
 *
 * Run once: node scripts/apply-documents-download-permission.mjs   (idempotent)
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

const sqlFile = join(process.cwd(), "docs/sql/documents-download-permission.sql");
const migrationSql = readFileSync(sqlFile, "utf8");

const sql = postgres(url, { max: 1 });

try {
  const [rbacBase] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'role_permissions'
    ) AS exists
  `;
  if (!rbacBase?.exists) {
    console.error("RBAC base no aplicada. Ejecuta primero: node scripts/apply-rbac-migration.mjs");
    process.exit(1);
  }

  const [existing] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM public.permissions WHERE key = 'documents.download'
    ) AS exists
  `;

  if (existing?.exists) {
    console.log("✓ Permiso documents.download ya existe");
  } else {
    console.log("Aplicando permiso documents.download…");
    await sql.unsafe(migrationSql);
    console.log("✓ Migración aplicada");
  }

  const rows = await sql`
    SELECT r.slug, bool_or(p.key = 'documents.download') AS has_download
    FROM public.roles r
    LEFT JOIN public.role_permissions rp ON rp.role_id = r.id
    LEFT JOIN public.permissions p ON p.id = rp.permission_id
    GROUP BY r.slug
    ORDER BY r.slug
  `;
  console.log("Roles y estado de documents.download:", rows);
  console.log("Done.");
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await sql.end();
}
