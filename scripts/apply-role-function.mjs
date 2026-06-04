/**
 * One-shot script: drops overly-permissive user_roles SELECT policy and
 * creates a SECURITY DEFINER computed-column function so PostgREST can
 * expose uploader role per document row without leaking the full table.
 *
 * Run once: node scripts/apply-role-function.mjs
 */
import pkg from "@next/env";
import postgres from "postgres";

const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
  await sql.begin(async (tx) => {
    // 1. Drop the overly-permissive policy applied earlier via db:push
    await tx`
      DROP POLICY IF EXISTS "user_roles_select_all_authenticated" ON user_roles
    `;
    console.log("✓ Dropped permissive policy");

    // 2. SECURITY DEFINER computed column for PostgREST.
    //    Named documents_uploader_role(documents) → accessible as
    //    uploader_role in .select() on the documents table.
    await tx`
      CREATE OR REPLACE FUNCTION public.documents_uploader_role(doc documents)
      RETURNS text
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      SET search_path = public
      AS $$
        SELECT role::text FROM user_roles WHERE user_id = doc.uploaded_by LIMIT 1
      $$
    `;
    console.log("✓ Created SECURITY DEFINER function documents_uploader_role");

    // 3. Grant execute to authenticated users (not anon)
    await tx`
      GRANT EXECUTE ON FUNCTION public.documents_uploader_role(documents) TO authenticated
    `;
    console.log("✓ Granted EXECUTE to authenticated");
  });

  console.log("\nDone.");
} finally {
  await sql.end();
}
