/**
 * Applies the profiles personal-info migration
 * (docs/sql/profiles-personal-info.sql): splits full_name into
 * first_name/last_name, adds document_number + phone, and enables RLS on
 * profiles (self-or-admin, via has_permission('users.read'/'users.update')).
 *
 * Run once: node scripts/apply-profiles-personal-info.mjs   (idempotent)
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

const sqlFile = join(process.cwd(), "docs/sql/profiles-personal-info.sql");
const migrationSql = readFileSync(sqlFile, "utf8");

const sql = postgres(url, { max: 1 });

try {
  const [already] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'first_name'
    ) AS exists
  `;

  if (already?.exists) {
    console.log("✓ profiles.first_name ya existe");
  } else {
    console.log("Aplicando migración de datos personales de perfil…");
    await sql.unsafe(migrationSql);
    console.log("✓ Migración aplicada");
  }

  const [rls] = await sql`
    SELECT relrowsecurity FROM pg_class WHERE oid = 'public.profiles'::regclass
  `;
  console.log(`RLS en profiles: ${rls?.relrowsecurity === true ? "habilitado" : "DESHABILITADO"}`);
  console.log("Done.");
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await sql.end();
}
