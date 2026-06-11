-- Aplica el cambio de FK para conservar documentos al eliminar usuarios.
-- Ejecutar en Supabase SQL Editor si `pnpm db:migrate` falla por migraciones previas.

ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_uploaded_by_profiles_id_fk";
ALTER TABLE "documents" ALTER COLUMN "uploaded_by" DROP NOT NULL;
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_profiles_id_fk"
  FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
