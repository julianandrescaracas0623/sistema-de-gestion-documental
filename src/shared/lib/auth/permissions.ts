export const PERMISSION_KEYS = [
  "users.manage",
  "roles.manage",
  "documents.read",
  "documents.create",
  "documents.update",
  "documents.delete",
  "categories.manage",
  "tags.manage",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const ADMIN_PERMISSION_KEYS: PermissionKey[] = [...PERMISSION_KEYS];

export const DEFAULT_USER_PERMISSION_KEYS: PermissionKey[] = [
  "documents.read",
  "documents.create",
  "documents.update",
  "documents.delete",
];

export const ADMIN_NAV_PERMISSIONS: PermissionKey[] = [
  "users.manage",
  "roles.manage",
  "categories.manage",
  "tags.manage",
];

export function hasPermission(permissions: readonly string[], key: PermissionKey): boolean {
  return permissions.includes(key);
}

export function hasAnyPermission(
  permissions: readonly string[],
  keys: readonly PermissionKey[]
): boolean {
  return keys.some((key) => permissions.includes(key));
}
