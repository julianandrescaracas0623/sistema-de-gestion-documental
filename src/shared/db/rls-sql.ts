import { sql } from "drizzle-orm";

import type { PermissionKey } from "@/shared/lib/auth/permissions";

/** Postgres SECURITY DEFINER function public.has_permission(text) */
export function hasPermission(key: PermissionKey) {
  return sql`(select public.has_permission(${key}))`;
}

export const canManageUsers = hasPermission("users.manage");
export const canManageRoles = hasPermission("roles.manage");
export const canReadDocuments = hasPermission("documents.read");
export const canCreateDocuments = hasPermission("documents.create");
export const canUpdateDocuments = hasPermission("documents.update");
export const canDeleteDocuments = hasPermission("documents.delete");
