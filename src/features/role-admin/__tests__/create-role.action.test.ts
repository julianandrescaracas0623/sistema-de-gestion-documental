import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsertRole = vi.fn();
const mockDeleteRole = vi.fn();
const mockPermsSelect = vi.fn();
const mockLinkInsert = vi.fn();
const mockSlugLookup = vi.fn();

vi.mock("@/shared/lib/auth/get-session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from(table: string) {
        if (table === "roles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: mockSlugLookup,
              }),
            }),
            insert: () => ({
              select: () => ({
                single: mockInsertRole,
              }),
            }),
            delete: () => ({
              eq: mockDeleteRole,
            }),
          };
        }
        if (table === "permissions") {
          return {
            select: () => ({
              in: mockPermsSelect,
            }),
          };
        }
        if (table === "role_permissions") {
          return { insert: mockLinkInsert };
        }
        return {};
      },
    })
  ),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("createRoleAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue({
      userId: "admin-1",
      email: "admin@test.com",
      fullName: "Admin",
      roleId: "role-1",
      roleSlug: "admin",
      roleName: "Administrador",
      permissions: ["roles.manage"],
      role: "admin",
    });
    mockSlugLookup.mockResolvedValue({ data: null, error: null });
    mockInsertRole.mockResolvedValue({
      data: { id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
      error: null,
    });
    mockPermsSelect.mockResolvedValue({
      data: [{ id: "11111111-2222-3333-4444-555555555555", key: "documents.read" }],
      error: null,
    });
    mockLinkInsert.mockResolvedValue({ error: null });
  });

  it("denies users without roles.manage", async () => {
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue({
      userId: "u1",
      email: "u@test.com",
      fullName: "User",
      roleId: "role-2",
      roleSlug: "user",
      roleName: "Usuario",
      permissions: ["documents.read"],
      role: "user",
    });

    const { createRoleAction } = await import("../actions/create-role.action");
    const fd = new FormData();
    fd.set("name", "Revisor");
    fd.set("permissionKeys", "documents.read");

    const result = await createRoleAction(null, fd);

    expect(result.status).toBe("error");
    expect(mockInsertRole).not.toHaveBeenCalled();
  });

  it("creates role with permissions when authorized", async () => {
    const { createRoleAction } = await import("../actions/create-role.action");
    const fd = new FormData();
    fd.set("name", "Revisor");
    fd.set("permissionKeys", "documents.read");

    const result = await createRoleAction(null, fd);

    expect(result.status).toBe("success");
    expect(mockInsertRole).toHaveBeenCalled();
    expect(mockLinkInsert).toHaveBeenCalled();
  });
});
