import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { canDeleteTags, canInsertTags, canUpdateTags } from "./rls-sql";

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
      withCheck: canInsertTags,
    }).link(t as unknown as PgTable),
    pgPolicy("tags_update_admin", {
      for: "update",
      to: "authenticated",
      using: canUpdateTags,
      withCheck: sql`true`,
    }).link(t as unknown as PgTable),
    pgPolicy("tags_delete_admin", {
      for: "delete",
      to: "authenticated",
      using: canDeleteTags,
    }).link(t as unknown as PgTable),
  ],
).enableRLS();

export const insertTagSchema = createInsertSchema(tags);
export const selectTagSchema = createSelectSchema(tags);

export type InsertTag = typeof tags.$inferInsert;
export type SelectTag = typeof tags.$inferSelect;
