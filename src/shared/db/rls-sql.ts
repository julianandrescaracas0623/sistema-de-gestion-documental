import { sql } from "drizzle-orm";

import type { PermissionKey } from "@/shared/lib/auth/permissions";

/** Postgres SECURITY DEFINER function public.has_permission(text) */
export function hasPermission(key: PermissionKey) {
  return sql`(select public.has_permission(${key}))`;
}

export const canReadUsers = hasPermission("users.read");
export const canCreateUsers = hasPermission("users.create");
export const canUpdateUsers = hasPermission("users.update");
export const canDeleteUsers = hasPermission("users.delete");

export const canReadRoles = hasPermission("roles.read");
export const canCreateRoles = hasPermission("roles.create");
export const canUpdateRoles = hasPermission("roles.update");
export const canDeleteRoles = hasPermission("roles.delete");

export const canReadDocuments = hasPermission("documents.read");
export const canCreateDocuments = hasPermission("documents.create");
export const canUpdateDocuments = hasPermission("documents.update");
export const canDeleteDocuments = hasPermission("documents.delete");

export const canReadCategories = hasPermission("categories.read");
export const canCreateCategories = hasPermission("categories.create");
export const canUpdateCategories = hasPermission("categories.update");
export const canDeleteCategories = hasPermission("categories.delete");

export const canReadTags = hasPermission("tags.read");
export const canCreateTags = hasPermission("tags.create");
export const canUpdateTags = hasPermission("tags.update");
export const canDeleteTags = hasPermission("tags.delete");

/** Tag insert during document upload or admin create */
export const canInsertTags = sql`(
  (select public.has_permission('tags.create'))
  OR (select public.has_permission('tags.manage'))
  OR (select public.has_permission('documents.create'))
)`;
