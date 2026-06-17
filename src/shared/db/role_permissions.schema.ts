import { relations, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { pgPolicy, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";

import { permissions } from "./permissions.schema";
import { canUpdateRoles } from "./rls-sql";
import { roles } from "./roles.schema";

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.roleId, t.permissionId] }),
    pgPolicy("role_permissions_select_authenticated", {
      for: "select",
      to: "authenticated",
      using: sql`true`,
    }).link(t as unknown as PgTable),
    pgPolicy("role_permissions_insert_manage", {
      for: "insert",
      to: "authenticated",
      withCheck: canUpdateRoles,
    }).link(t as unknown as PgTable),
    pgPolicy("role_permissions_delete_manage", {
      for: "delete",
      to: "authenticated",
      using: canUpdateRoles,
    }).link(t as unknown as PgTable),
  ],
).enableRLS();

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));
