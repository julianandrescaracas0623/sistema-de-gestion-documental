import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { canReadUsers, canUpdateUsers } from "./rls-sql";

/**
 * A regular user's own row is created by an admin (service-role client, bypasses
 * RLS) with first/last name + email captured at account creation; the user then
 * fills in document number / phone themselves from /perfil.
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    documentNumber: text("document_number"),
    phone: text("phone"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => {
    const isSelf = sql`${t.id} = auth.uid()`;
    return [
      pgPolicy("profiles_select_self_or_admin", {
        for: "select",
        to: "authenticated",
        using: sql`(${isSelf} or ${canReadUsers})`,
      }).link(t as unknown as PgTable),
      pgPolicy("profiles_update_self_or_admin", {
        for: "update",
        to: "authenticated",
        using: sql`(${isSelf} or ${canUpdateUsers})`,
        withCheck: sql`(${isSelf} or ${canUpdateUsers})`,
      }).link(t as unknown as PgTable),
    ];
  },
).enableRLS();

export const insertProfileSchema = createInsertSchema(profiles);
export const selectProfileSchema = createSelectSchema(profiles);

export type InsertProfile = typeof profiles.$inferInsert;
export type SelectProfile = typeof profiles.$inferSelect;
