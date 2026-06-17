import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { boolean, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { canCreateRoles, canDeleteRoles, canUpdateRoles } from "./rls-sql";

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    pgPolicy("roles_select_authenticated", {
      for: "select",
      to: "authenticated",
      using: sql`true`,
    }).link(t as unknown as PgTable),
    pgPolicy("roles_insert_manage", {
      for: "insert",
      to: "authenticated",
      withCheck: canCreateRoles,
    }).link(t as unknown as PgTable),
    pgPolicy("roles_update_manage", {
      for: "update",
      to: "authenticated",
      using: canUpdateRoles,
      withCheck: canUpdateRoles,
    }).link(t as unknown as PgTable),
    pgPolicy("roles_delete_manage", {
      for: "delete",
      to: "authenticated",
      using: sql`${canDeleteRoles} and not ${t.isSystem}`,
    }).link(t as unknown as PgTable),
  ],
).enableRLS();

export const insertRoleSchema = createInsertSchema(roles);
export const selectRoleSchema = createSelectSchema(roles);

export type InsertRole = typeof roles.$inferInsert;
export type SelectRole = typeof roles.$inferSelect;

/** Legacy slugs kept for migration and guards */
export const SYSTEM_ROLE_SLUGS = ["admin", "user"] as const;
export type SystemRoleSlug = (typeof SYSTEM_ROLE_SLUGS)[number];
