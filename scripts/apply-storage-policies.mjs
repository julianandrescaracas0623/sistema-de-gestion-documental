/**
 * Crea el bucket privado `documents` y sus políticas RLS de storage.objects
 * (docs/sql/storage-documents-bucket.sql). Idempotente.
 *
 * Depende de: apply-rbac-granular.mjs (las políticas usan public.has_permission).
 *
 * Run once: node scripts/apply-storage-policies.mjs
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

const sqlFile = join(process.cwd(), "docs/sql/storage-documents-bucket.sql");
const migrationSql = readFileSync(sqlFile, "utf8");

const sql = postgres(url, { max: 1 });

try {
  const [fn] = await sql`SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_permission') AS exists`;
  if (!fn?.exists) {
    console.error("public.has_permission no existe. Ejecuta antes: node scripts/apply-rbac-migration.mjs");
    process.exit(1);
  }

  console.log("Aplicando bucket + políticas de storage…");
  await sql.unsafe(migrationSql);

  const [{ count }] = await sql`
    SELECT count(*)::int AS count FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE 'documents_storage_%'
  `;
  const [bucket] = await sql`SELECT public FROM storage.buckets WHERE id = 'documents'`;
  console.log(`✓ Bucket 'documents' (public=${String(bucket?.public)}) · ${count} políticas`);
  console.log("Done.");
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await sql.end();
}
