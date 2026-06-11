ALTER TABLE "documents" DROP CONSTRAINT "documents_uploaded_by_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "uploaded_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "tags_update_admin" ON "tags" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin')) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "tags_delete_admin" ON "tags" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin'));