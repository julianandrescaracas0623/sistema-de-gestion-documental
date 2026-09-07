import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PermissionKey } from "@/shared/lib/auth/permissions";

const mockRoleLookup = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/shared/lib/auth/get-session", () => ({ getSession: vi.fn() }));
vi.mock("@/shared/lib/audit/record-audit", () => ({ recordAudit: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from(table: string) {
        if (table === "roles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: mockRoleLookup }) }),
          };
        }
        return {};
      },
      rpc: mockRpc,
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
    mockRpc.mockResolvedValue({ data: true, error: null });
  });

  it("updates a role when authorized and granting only held permissions", async () => {
    const { updateRoleAction } = await import("../actions/update-role.action");
    const result = await updateRoleAction(null, form(ROLE_ID, "documents.read"));
    expect(result.status).toBe("success");
    expect(mockRpc).toHaveBeenCalledWith(
      "update_role_with_permissions",
      expect.objectContaining({ p_role_id: ROLE_ID, p_permission_keys: ["documents.read"] })
    );
  });

  it("blocks editing the caller's own role", async () => {
    const { updateRoleAction } = await import("../actions/update-role.action");
    const result = await updateRoleAction(null, form(OWN_ROLE_ID, "documents.read"));
    expect(result).toEqual({ status: "error", message: "No puedes editar tu propio rol." });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("blocks granting a permission the caller does not hold", async () => {
    const { updateRoleAction } = await import("../actions/update-role.action");
    const result = await updateRoleAction(null, form(ROLE_ID, "users.delete"));
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/no puedes otorgar/i);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("reports an error when the RPC affects no rows (RLS blocked)", async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });
    const { updateRoleAction } = await import("../actions/update-role.action");
    const result = await updateRoleAction(null, form(ROLE_ID, "documents.read"));
    expect(result).toEqual({ status: "error", message: "No tienes permiso para editar este rol." });
  });

  it("reports invalid permissions when the RPC rejects the permission set", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "invalid_permission_keys" } });
    const { updateRoleAction } = await import("../actions/update-role.action");
    const result = await updateRoleAction(null, form(ROLE_ID, "documents.read"));
    expect(result).toEqual({ status: "error", message: "Uno o más permisos no son válidos." });
  });
});
