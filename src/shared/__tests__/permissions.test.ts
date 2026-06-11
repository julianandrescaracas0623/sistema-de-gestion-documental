import { describe, it, expect } from "vitest";

import {
  hasAnyPermission,
  hasPermission,
  PERMISSION_KEYS,
} from "@/shared/lib/auth/permissions";

describe("permissions helpers", () => {
  const adminPerms = [...PERMISSION_KEYS];

  it("hasPermission returns true when key is present", () => {
    expect(hasPermission(adminPerms, "users.manage")).toBe(true);
    expect(hasPermission(adminPerms, "roles.manage")).toBe(true);
  });

  it("hasPermission returns false when key is absent", () => {
    expect(hasPermission(["documents.read"], "users.manage")).toBe(false);
  });

  it("hasAnyPermission matches any key in the list", () => {
    expect(hasAnyPermission(["documents.read"], ["users.manage", "documents.read"])).toBe(true);
    expect(hasAnyPermission(["tags.manage"], ["users.manage", "documents.read"])).toBe(false);
  });
});
