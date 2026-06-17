export const PERMISSION_KEYS = [
  "users.read",
  "users.create",
  "users.update",
  "users.delete",
  "roles.read",
  "roles.create",
  "roles.update",
  "roles.delete",
  "documents.read",
  "documents.create",
  "documents.update",
  "documents.delete",
  "categories.read",
  "categories.create",
  "categories.update",
  "categories.delete",
  "tags.read",
  "tags.create",
  "tags.update",
  "tags.delete",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type PermissionModule = "users" | "roles" | "documents" | "categories" | "tags";

export const MODULE_PERMISSIONS: Record<PermissionModule, PermissionKey[]> = {
  users: ["users.read", "users.create", "users.update", "users.delete"],
  roles: ["roles.read", "roles.create", "roles.update", "roles.delete"],
  documents: ["documents.read", "documents.create", "documents.update", "documents.delete"],
  categories: ["categories.read", "categories.create", "categories.update", "categories.delete"],
  tags: ["tags.read", "tags.create", "tags.update", "tags.delete"],
};

/** Legacy keys mapped during DB migration — still recognized in has_permission SQL. */
export const LEGACY_MANAGE_ALIASES: Record<PermissionModule, string> = {
  users: "users.manage",
  roles: "roles.manage",
  documents: "documents.manage",
  categories: "categories.manage",
  tags: "tags.manage",
};

export const ADMIN_PERMISSION_KEYS: PermissionKey[] = [...PERMISSION_KEYS];

export const DEFAULT_USER_PERMISSION_KEYS: PermissionKey[] = [
  "documents.read",
  "documents.create",
  "documents.update",
  "documents.delete",
];

export const ADMIN_NAV_MODULES: PermissionModule[] = ["users", "roles", "categories", "tags"];

export function hasPermission(permissions: readonly string[], key: PermissionKey): boolean {
  return permissions.includes(key);
}

export function hasAnyPermission(
  permissions: readonly string[],
  keys: readonly PermissionKey[]
): boolean {
  return keys.some((key) => permissions.includes(key));
}

/** True if user can access an admin module (any CRUD or legacy .manage). */
export function canAccessModule(permissions: readonly string[], module: PermissionModule): boolean {
  if (hasAnyPermission(permissions, MODULE_PERMISSIONS[module])) {
    return true;
  }
  return permissions.includes(LEGACY_MANAGE_ALIASES[module]);
}

export function hasModulePermission(
  permissions: readonly string[],
  module: PermissionModule,
  action: "read" | "create" | "update" | "delete"
): boolean {
  const key = `${module}.${action}`;
  if (hasPermission(permissions, key as PermissionKey)) return true;
  return permissions.includes(LEGACY_MANAGE_ALIASES[module]);
}

export function hasAnyAdminNavPermission(permissions: readonly string[]): boolean {
  return ADMIN_NAV_MODULES.some((m) => canAccessModule(permissions, m));
}
