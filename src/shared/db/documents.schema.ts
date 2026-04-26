import { relations, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import {
  bigint,
  index,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { categories } from "./categories.schema";
import { profiles } from "./profiles.schema";
import { tags } from "./tags.schema";

const isAdmin = sql`exists (
  select 1 from user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
)`;

/**
 * Document metadata; binary lives in Supabase Storage (`storage_object_path`).
 */
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    fileName: text("file_name").notNull(),
    storageObjectPath: text("storage_object_path").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    mimeType: text("mime_type").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => {
    const ownerActiveRow = sql`${t.uploadedBy} = auth.uid() and ${t.deletedAt} is null`;
    const selectVisible = sql`(${isAdmin} or ${ownerActiveRow})`;
    const updateUsing = sql`(${isAdmin} or ${t.uploadedBy} = auth.uid())`;
    const updateWithCheck = sql`(${isAdmin} or ${t.uploadedBy} = auth.uid())`;

    return [
      index("documents_uploaded_by_idx").on(t.uploadedBy),
      index("documents_deleted_at_idx").on(t.deletedAt),
      index("documents_category_id_idx").on(t.categoryId),
      pgPolicy("documents_select_authenticated", {
        for: "select",
        to: "authenticated",
        using: selectVisible,
      }).link(t as unknown as PgTable),
      pgPolicy("documents_insert_authenticated", {
        for: "insert",
        to: "authenticated",
        withCheck: sql`${t.uploadedBy} = auth.uid()`,
      }).link(t as unknown as PgTable),
      pgPolicy("documents_update_authenticated", {
        for: "update",
        to: "authenticated",
        using: updateUsing,
        withCheck: updateWithCheck,
      }).link(t as unknown as PgTable),
    ];
  },
).enableRLS();

export const documentTags = pgTable(
  "document_tags",
  {
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => {
    const canLink = sql`exists (
      select 1 from documents
      where documents.id = ${t.documentId}
      and (
        ${isAdmin}
        or (documents.uploaded_by = auth.uid() and documents.deleted_at is null)
      )
    )`;
    return [
      primaryKey({ columns: [t.documentId, t.tagId] }),
      pgPolicy("document_tags_select_authenticated", {
        for: "select",
        to: "authenticated",
        using: canLink,
      }).link(t as unknown as PgTable),
      pgPolicy("document_tags_insert_authenticated", {
        for: "insert",
        to: "authenticated",
        withCheck: canLink,
      }).link(t as unknown as PgTable),
      pgPolicy("document_tags_delete_authenticated", {
        for: "delete",
        to: "authenticated",
        using: canLink,
      }).link(t as unknown as PgTable),
    ];
  },
).enableRLS();

export const documentsRelations = relations(documents, ({ one, many }) => ({
  category: one(categories, {
    fields: [documents.categoryId],
    references: [categories.id],
  }),
  uploader: one(profiles, {
    fields: [documents.uploadedBy],
    references: [profiles.id],
  }),
  documentTags: many(documentTags),
}));

export const documentTagsRelations = relations(documentTags, ({ one }) => ({
  document: one(documents, {
    fields: [documentTags.documentId],
    references: [documents.id],
  }),
  tag: one(tags, {
    fields: [documentTags.tagId],
    references: [tags.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  documentTags: many(documentTags),
}));

export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);

export type InsertDocument = typeof documents.$inferInsert;
export type SelectDocument = typeof documents.$inferSelect;
