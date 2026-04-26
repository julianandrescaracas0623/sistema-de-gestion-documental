import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { integer, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

const isAdmin = sql`exists (
  select 1 from user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
)`;

/**
 * Categories for organizing documents.
 */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").default("#6B7280"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    pgPolicy("categories_select_authenticated", {
      for: "select",
      to: "authenticated",
      using: sql`true`,
    }).link(t as unknown as PgTable),
    pgPolicy("categories_insert_admin", {
      for: "insert",
      to: "authenticated",
      withCheck: isAdmin,
    }).link(t as unknown as PgTable),
    pgPolicy("categories_update_admin", {
      for: "update",
      to: "authenticated",
      using: isAdmin,
      withCheck: isAdmin,
    }).link(t as unknown as PgTable),
    pgPolicy("categories_delete_admin", {
      for: "delete",
      to: "authenticated",
      using: isAdmin,
    }).link(t as unknown as PgTable),
  ],
).enableRLS();

export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);

export type InsertCategory = typeof categories.$inferInsert;
export type SelectCategory = typeof categories.$inferSelect;
