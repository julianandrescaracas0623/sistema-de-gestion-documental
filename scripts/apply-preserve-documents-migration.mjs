/**
 * Syncs Drizzle journal when 0001 was applied manually, then applies 0002
 * (preserve documents on user delete). Run once: node scripts/apply-preserve-documents-migration.mjs
 */
import { createHash } from "node:crypto";
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

const migrationsDir = join(process.cwd(), "src/shared/db/migrations");

function migrationHash(tag) {
  const content = readFileSync(join(migrationsDir, `${tag}.sql`), "utf8");
  return createHash("sha256").update(content).digest("hex");
}

const sql = postgres(url, { max: 1 });

try {
  const applied = await sql`
    SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at
  `;
  const appliedHashes = new Set(applied.map((r) => r.hash));
  console.log(`Recorded migrations: ${applied.length}`);

  const toRecord = [];
  for (const tag of ["0001_rare_pete_wisdom", "0002_smart_stature"]) {
    const hash = migrationHash(tag);
    if (!appliedHashes.has(hash)) {
      toRecord.push({ tag, hash });
    } else {
      console.log(`✓ ${tag} already recorded`);
    }
  }

  const [uploadedByCol] = await sql`
    SELECT is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'documents'
      AND column_name = 'uploaded_by'
  `;

  const [fk] = await sql`
    SELECT confdeltype
    FROM pg_constraint
    WHERE conrelid = 'public.documents'::regclass
      AND contype = 'f'
      AND conname = 'documents_uploaded_by_profiles_id_fk'
  `;

  const needsFkFix = uploadedByCol?.is_nullable !== "YES" || fk?.confdeltype !== "n";

  const pending0002 = toRecord.some((m) => m.tag === "0002_smart_stature");

  if (pending0002 && needsFkFix) {
    console.log("Applying uploaded_by SET NULL migration…");
    await sql.begin(async (tx) => {
      await tx`
        ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_uploaded_by_profiles_id_fk"
      `;
      await tx`
        ALTER TABLE "documents" ALTER COLUMN "uploaded_by" DROP NOT NULL
      `;
      await tx`
        ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_profiles_id_fk"
          FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION
      `;
      await tx`DROP POLICY IF EXISTS "tags_update_admin" ON "tags"`;
      await tx`
        CREATE POLICY "tags_update_admin" ON "tags" AS PERMISSIVE FOR UPDATE TO "authenticated"
          USING (exists (select 1 from user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin'))
          WITH CHECK (true)
      `;
      await tx`DROP POLICY IF EXISTS "tags_delete_admin" ON "tags"`;
      await tx`
        CREATE POLICY "tags_delete_admin" ON "tags" AS PERMISSIVE FOR DELETE TO "authenticated"
          USING (exists (select 1 from user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin'))
      `;
    });
    console.log("✓ Schema changes applied");
  } else if (!needsFkFix) {
    console.log("✓ uploaded_by FK already SET NULL / nullable");
  }

  for (const { tag, hash } of toRecord) {
    if (tag === "0001_rare_pete_wisdom") {
      const [{ exists: hasCreatedBy }] = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'categories'
            AND column_name = 'created_by'
        ) AS exists
      `;
      if (!hasCreatedBy) {
        console.error(`Cannot record ${tag}: column categories.created_by missing in DB`);
        process.exit(1);
      }
      console.log(`Recording ${tag} in drizzle journal (already applied in DB)…`);
    }

    if (tag === "0002_smart_stature") {
      console.log(`Recording ${tag} in drizzle journal…`);
    }

    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${Date.now()})
    `;
    console.log(`✓ Recorded ${tag}`);
  }

  console.log("Done.");
} finally {
  await sql.end();
}
