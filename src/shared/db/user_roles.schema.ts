import { relations, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { profiles } from "./profiles.schema";

/**
 * User roles enum values
 */
export const ROLE_NAMES = ["admin", "user"] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

/**
 * User roles table for RBAC
 */
export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: text("role", { enum: ROLE_NAMES }).notNull().default("user"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    pgPolicy("user_roles_select_own", {
      for: "select",
      to: "authenticated",
      using: sql`${t.userId} = auth.uid()`,
    }).link(t as unknown as PgTable),
  ],
).enableRLS();

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(profiles, {
    fields: [userRoles.userId],
    references: [profiles.id],
  }),
}));

export const insertUserRoleSchema = createInsertSchema(userRoles);
export const selectUserRoleSchema = createSelectSchema(userRoles);

export type InsertUserRole = typeof userRoles.$inferInsert;
export type SelectUserRole = typeof userRoles.$inferSelect;
