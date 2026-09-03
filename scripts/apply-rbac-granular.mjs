/**
 * Applies the granular RBAC permissions migration
 * (docs/sql/rbac-granular-permissions.sql): adds the per-module CRUD permission
 * keys, backfills roles that had the legacy `*.manage` keys, gives `admin` all
 * of them, and replaces the categories/tags/roles RLS policies with
 * `has_permission()`-based ones (with a `*.manage` alias fallback).
 *
 * Depends on: apply-rbac-migration.mjs having run first (needs the `permissions`,
 * `roles`, `role_permissions` tables and `user_roles.role_id`).
 *
 * Run once: node scripts/apply-rbac-granular.mjs   (idempotent)
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

const sqlFile = join(process.cwd(), "docs/sql/rbac-granular-permissions.sql");
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

  const [granular] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM public.permissions WHERE key = 'categories.create'
    ) AS exists
  `;

  if (granular?.exists) {
    console.log("✓ Permisos granulares ya aplicados");
  } else {
    console.log("Aplicando permisos granulares (categorías, tags, usuarios, roles)…");
    await sql.unsafe(migrationSql);
    console.log("✓ Migración aplicada");
  }

  // Limpieza: la función documents_uploader_role() era parte del enfoque antiguo
  // de exponer el rol del uploader; ahora se resuelve con un join en
  // getRolesForUploaders(). Además referencia la columna user_roles.role ya
  // eliminada por apply-rbac-migration, así que quedaría rota si se invocara.
  await sql`DROP FUNCTION IF EXISTS public.documents_uploader_role(public.documents)`;
  console.log("✓ Función obsoleta documents_uploader_role eliminada (si existía)");

  const [{ count: permCount }] = await sql`SELECT count(*)::int AS count FROM public.permissions`;
  const [{ count: adminPerms }] = await sql`
    SELECT count(*)::int AS count
    FROM public.role_permissions rp
    JOIN public.roles r ON r.id = rp.role_id
    WHERE r.slug = 'admin'
  `;
  console.log(`Permisos en catálogo: ${permCount} · permisos del rol admin: ${adminPerms}`);
  console.log("Done.");
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await sql.end();
}
