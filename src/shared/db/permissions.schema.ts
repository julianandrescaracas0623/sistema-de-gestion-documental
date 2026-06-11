import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    module: text("module").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    pgPolicy("permissions_select_authenticated", {
      for: "select",
      to: "authenticated",
      using: sql`true`,
    }).link(t as unknown as PgTable),
  ],
).enableRLS();

export const insertPermissionSchema = createInsertSchema(permissions);
export const selectPermissionSchema = createSelectSchema(permissions);

export type InsertPermission = typeof permissions.$inferInsert;
export type SelectPermission = typeof permissions.$inferSelect;
