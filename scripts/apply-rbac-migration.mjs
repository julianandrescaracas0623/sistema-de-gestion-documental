/**
 * Applies RBAC + profiles.full_name migration.
 * Run once: node scripts/apply-rbac-migration.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import pkg from "@next/env";
import postgres from "postgres";

const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sqlFile = join(process.cwd(), "docs/sql/rbac-and-full-name.sql");
const migrationSql = readFileSync(sqlFile, "utf8");

const sql = postgres(url, { max: 1 });

try {
  const [rolesTable] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'roles'
    ) AS exists
  `;

  const [roleIdCol] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_roles'
        AND column_name = 'role_id'
    ) AS exists
  `;

  const [legacyRoleCol] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_roles'
        AND column_name = 'role'
    ) AS exists
  `;

  if (rolesTable?.exists && roleIdCol?.exists && !legacyRoleCol?.exists) {
    console.log("✓ RBAC schema already applied");
  } else {
    console.log("Applying RBAC + full_name migration…");
    await sql.unsafe(migrationSql);
    console.log("✓ Migration applied");
  }

  const [{ count: permCount }] = await sql`SELECT count(*)::int AS count FROM public.permissions`;
  const [{ count: roleCount }] = await sql`SELECT count(*)::int AS count FROM public.roles`;
  console.log(`Permissions: ${permCount}, Roles: ${roleCount}`);
  console.log("Done.");
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await sql.end();
}
