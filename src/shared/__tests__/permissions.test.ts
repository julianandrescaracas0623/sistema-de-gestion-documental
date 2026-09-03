import { describe, expect, it } from "vitest";

import {
  ADMIN_PERMISSION_KEYS,
  canAccessModule,
  DEFAULT_USER_PERMISSION_KEYS,
  hasAnyPermission,
  hasModulePermission,
  hasPermission,
  hasPermissionKey,
  MODULE_PERMISSIONS,
  permissionsNotGrantableBy,
} from "@/shared/lib/auth/permissions";

describe("permissions", () => {
  const adminPerms = ADMIN_PERMISSION_KEYS;

  it("admin has all granular keys", () => {
    expect(hasPermission(adminPerms, "users.read")).toBe(true);
    expect(hasPermission(adminPerms, "roles.create")).toBe(true);
    expect(hasPermission(adminPerms, "categories.delete")).toBe(true);
    expect(hasPermission(adminPerms, "tags.update")).toBe(true);
  });

  it("default user has documents only", () => {
    for (const key of DEFAULT_USER_PERMISSION_KEYS) {
      expect(hasPermission(DEFAULT_USER_PERMISSION_KEYS, key)).toBe(true);
    }
    expect(hasPermission(DEFAULT_USER_PERMISSION_KEYS, "users.read")).toBe(false);
  });

  it("hasAnyPermission works across modules", () => {
    expect(hasAnyPermission(["documents.read"], ["users.read", "documents.read"])).toBe(true);
    expect(hasAnyPermission(["tags.read"], ["users.read", "documents.read"])).toBe(false);
  });

  it("canAccessModule with granular read", () => {
    expect(canAccessModule(["categories.read"], "categories")).toBe(true);
    expect(canAccessModule(["documents.read"], "categories")).toBe(false);
  });

  it("canAccessModule with legacy manage alias in session", () => {
    expect(canAccessModule(["tags.manage"], "tags")).toBe(true);
  });

  it("hasModulePermission checks action level", () => {
    expect(hasModulePermission(["tags.read"], "tags", "delete")).toBe(false);
    expect(hasModulePermission(["tags.delete"], "tags", "delete")).toBe(true);
    expect(hasModulePermission(["tags.manage"], "tags", "delete")).toBe(true);
  });

  it("MODULE_PERMISSIONS has 4 keys per admin module", () => {
    expect(MODULE_PERMISSIONS.users).toHaveLength(4);
    expect(MODULE_PERMISSIONS.categories).toHaveLength(4);
  });

  it("hasPermissionKey honours the legacy .manage alias", () => {
    expect(hasPermissionKey(["categories.create"], "categories.create")).toBe(true);
    expect(hasPermissionKey(["categories.manage"], "categories.create")).toBe(true);
    expect(hasPermissionKey(["categories.read"], "categories.create")).toBe(false);
  });

  it("permissionsNotGrantableBy returns keys the caller lacks", () => {
    expect(permissionsNotGrantableBy(["roles.create", "roles.read"], ["roles.read"])).toEqual([]);
    expect(
      permissionsNotGrantableBy(["roles.create"], ["users.delete", "roles.update"])
    ).toEqual(["users.delete", "roles.update"]);
    // an admin holding .manage can grant every granular key of that module
    expect(permissionsNotGrantableBy(["users.manage"], ["users.create", "users.delete"])).toEqual([]);
  });
});
