CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6B7280',
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_tags" (
	"document_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "document_tags_document_id_tag_id_pk" PRIMARY KEY("document_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "document_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_name" text NOT NULL,
	"storage_object_path" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"mime_type" text NOT NULL,
	"category_id" uuid,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "document_tags" ADD CONSTRAINT "document_tags_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tags" ADD CONSTRAINT "document_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_uploaded_by_idx" ON "documents" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "documents_deleted_at_idx" ON "documents" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "documents_category_id_idx" ON "documents" USING btree ("category_id");--> statement-breakpoint
CREATE POLICY "categories_select_authenticated" ON "categories" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "categories_insert_admin" ON "categories" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
  select 1 from user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
));--> statement-breakpoint
CREATE POLICY "categories_update_admin" ON "categories" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
  select 1 from user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
)) WITH CHECK (exists (
  select 1 from user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
));--> statement-breakpoint
CREATE POLICY "categories_delete_admin" ON "categories" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
  select 1 from user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
));--> statement-breakpoint
CREATE POLICY "document_tags_select_authenticated" ON "document_tags" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
      select 1 from documents
      where documents.id = "document_tags"."document_id"
      and (
        exists (
  select 1 from user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
)
        or (documents.uploaded_by = auth.uid() and documents.deleted_at is null)
      )
    ));--> statement-breakpoint
CREATE POLICY "document_tags_insert_authenticated" ON "document_tags" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
      select 1 from documents
      where documents.id = "document_tags"."document_id"
      and (
        exists (
  select 1 from user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
)
        or (documents.uploaded_by = auth.uid() and documents.deleted_at is null)
      )
    ));--> statement-breakpoint
CREATE POLICY "document_tags_delete_authenticated" ON "document_tags" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
      select 1 from documents
      where documents.id = "document_tags"."document_id"
      and (
        exists (
  select 1 from user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
)
        or (documents.uploaded_by = auth.uid() and documents.deleted_at is null)
      )
    ));--> statement-breakpoint
CREATE POLICY "documents_select_authenticated" ON "documents" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((exists (
  select 1 from user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
) or "documents"."uploaded_by" = auth.uid() and "documents"."deleted_at" is null));--> statement-breakpoint
CREATE POLICY "documents_insert_authenticated" ON "documents" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("documents"."uploaded_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "documents_update_authenticated" ON "documents" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((exists (
  select 1 from user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
) or "documents"."uploaded_by" = auth.uid())) WITH CHECK ((exists (
  select 1 from user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
) or "documents"."uploaded_by" = auth.uid()));--> statement-breakpoint
CREATE POLICY "tags_select_authenticated" ON "tags" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "tags_insert_authenticated" ON "tags" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_roles_select_own" ON "user_roles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("user_roles"."user_id" = auth.uid());