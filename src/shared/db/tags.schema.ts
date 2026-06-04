import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * Normalized tags for documents (many-to-many via document_tags).
 */
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    pgPolicy("tags_select_authenticated", {
      for: "select",
      to: "authenticated",
      using: sql`true`,
    }).link(t as unknown as PgTable),
    pgPolicy("tags_insert_authenticated", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`true`,
    }).link(t as unknown as PgTable),
    pgPolicy("tags_update_admin", {
      for: "update",
      to: "authenticated",
      using: sql`exists (select 1 from user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin')`,
      withCheck: sql`true`,
    }).link(t as unknown as PgTable),
    pgPolicy("tags_delete_admin", {
      for: "delete",
      to: "authenticated",
      using: sql`exists (select 1 from user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin')`,
    }).link(t as unknown as PgTable),
  ],
).enableRLS();

export const insertTagSchema = createInsertSchema(tags);
export const selectTagSchema = createSelectSchema(tags);

export type InsertTag = typeof tags.$inferInsert;
export type SelectTag = typeof tags.$inferSelect;
