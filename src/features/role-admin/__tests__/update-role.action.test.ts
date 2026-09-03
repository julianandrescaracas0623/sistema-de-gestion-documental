import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PermissionKey } from "@/shared/lib/auth/permissions";

const mockRoleLookup = vi.fn();
const mockRoleUpdate = vi.fn();
const mockLinksDelete = vi.fn();
const mockPermsSelect = vi.fn();
const mockLinkInsert = vi.fn();

vi.mock("@/shared/lib/auth/get-session", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from(table: string) {
        if (table === "roles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: mockRoleLookup }) }),
            update: () => ({ eq: () => ({ select: mockRoleUpdate }) }),
          };
        }
        if (table === "permissions") return { select: () => ({ in: mockPermsSelect }) };
        if (table === "role_permissions") {
          return { delete: () => ({ eq: mockLinksDelete }), insert: mockLinkInsert };
        }
        return {};
      },
    })
  ),
}));

const ROLE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const OWN_ROLE_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

function admin(overrides: Record<string, unknown> = {}) {
  return {
    userId: "admin-1",
    email: "a@test.com",
    fullName: "Admin",
    roleId: OWN_ROLE_ID,
    roleSlug: "admin",
    roleName: "Administrador",
    permissions: [
      "roles.update",
      "roles.read",
      "documents.read",
      "documents.update",
    ] as PermissionKey[],
    role: "admin" as const,
    ...overrides,
  };
}

function form(id: string, keys: string): FormData {
  const fd = new FormData();
  fd.set("id", id);
  fd.set("name", "Revisor");
  fd.set("permissionKeys", keys);
  return fd;
}

describe("updateRoleAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue(admin());
    mockRoleLookup.mockResolvedValue({ data: { id: ROLE_ID, is_system: false, slug: "revisor" }, error: null });
    mockRoleUpdate.mockResolvedValue({ data: [{ id: ROLE_ID }], error: null });
    mockLinksDelete.mockResolvedValue({ error: null });
    mockPermsSelect.mockResolvedValue({
      data: [{ id: "11111111-1111-1111-1111-111111111111", key: "documents.read" }],
      error: null,
    });
    mockLinkInsert.mockResolvedValue({ error: null });
  });

  it("updates a role when authorized and granting only held permissions", async () => {
    const { updateRoleAction } = await import("../actions/update-role.action");
    const result = await updateRoleAction(null, form(ROLE_ID, "documents.read"));
    expect(result.status).toBe("success");
    expect(mockLinkInsert).toHaveBeenCalled();
  });

  it("blocks editing the caller's own role", async () => {
    const { updateRoleAction } = await import("../actions/update-role.action");
    const result = await updateRoleAction(null, form(OWN_ROLE_ID, "documents.read"));
    expect(result).toEqual({ status: "error", message: "No puedes editar tu propio rol." });
    expect(mockRoleUpdate).not.toHaveBeenCalled();
  });

  it("blocks granting a permission the caller does not hold", async () => {
    const { updateRoleAction } = await import("../actions/update-role.action");
    const result = await updateRoleAction(null, form(ROLE_ID, "users.delete"));
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/no puedes otorgar/i);
    expect(mockRoleUpdate).not.toHaveBeenCalled();
  });

  it("reports an error when the role UPDATE affects no rows (RLS blocked)", async () => {
    mockRoleUpdate.mockResolvedValue({ data: [], error: null });
    const { updateRoleAction } = await import("../actions/update-role.action");
    const result = await updateRoleAction(null, form(ROLE_ID, "documents.read"));
    expect(result.status).toBe("error");
    expect(mockLinksDelete).not.toHaveBeenCalled();
  });
});
