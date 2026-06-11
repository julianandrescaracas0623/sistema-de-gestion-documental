import { relations, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { pgPolicy, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { profiles } from "./profiles.schema";
import { roles } from "./roles.schema";

/**
 * User role assignment (one role per user).
 */
export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
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
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const insertUserRoleSchema = createInsertSchema(userRoles);
export const selectUserRoleSchema = createSelectSchema(userRoles);

export type InsertUserRole = typeof userRoles.$inferInsert;
export type SelectUserRole = typeof userRoles.$inferSelect;
