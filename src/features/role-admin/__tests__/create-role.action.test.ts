import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSlugLookup = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/shared/lib/auth/get-session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/shared/lib/audit/record-audit", () => ({
  recordAudit: vi.fn(),
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
          };
        }
        return {};
      },
      rpc: mockRpc,
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
      permissions: ["roles.create", "documents.read"],
      role: "admin",
    });
    mockSlugLookup.mockResolvedValue({ data: null, error: null });
    mockRpc.mockResolvedValue({
      data: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      error: null,
    });
  });

  it("denies users without roles.create", async () => {
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
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("creates role with permissions when authorized", async () => {
    const { createRoleAction } = await import("../actions/create-role.action");
    const fd = new FormData();
    fd.set("name", "Revisor");
    fd.set("permissionKeys", "documents.read");

    const result = await createRoleAction(null, fd);

    expect(result.status).toBe("success");
    expect(mockRpc).toHaveBeenCalledWith(
      "create_role_with_permissions",
      expect.objectContaining({ p_name: "Revisor", p_permission_keys: ["documents.read"] })
    );
  });

  it("blocks granting a permission the caller does not hold (anti-escalation)", async () => {
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue({
      userId: "mgr-1",
      email: "mgr@test.com",
      fullName: "Manager",
      roleId: "role-3",
      roleSlug: "roles-manager",
      roleName: "Gestor de roles",
      permissions: ["roles.create", "roles.read"],
      role: null,
    });

    const { createRoleAction } = await import("../actions/create-role.action");
    const fd = new FormData();
    fd.set("name", "Superusuario");
    fd.set("permissionKeys", "users.delete,roles.update");

    const result = await createRoleAction(null, fd);

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/no puedes otorgar/i);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("reports invalid permissions when the RPC rejects the permission set", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "invalid_permission_keys" } });
    const { createRoleAction } = await import("../actions/create-role.action");
    const fd = new FormData();
    fd.set("name", "Revisor");
    fd.set("permissionKeys", "documents.read");

    const result = await createRoleAction(null, fd);

    expect(result).toEqual({ status: "error", message: "Uno o más permisos no son válidos." });
  });
});
