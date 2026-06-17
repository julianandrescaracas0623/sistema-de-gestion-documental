import { describe, expect, it } from "vitest";

import {
  ADMIN_PERMISSION_KEYS,
  canAccessModule,
  DEFAULT_USER_PERMISSION_KEYS,
  hasAnyPermission,
  hasModulePermission,
  hasPermission,
  MODULE_PERMISSIONS,
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
});
