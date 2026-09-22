import { describe, it, expect, vi, beforeEach } from "vitest";

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const TARGET_ID = "550e8400-e29b-41d4-a716-446655440000";
const ADMIN_ROLE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const USER_ROLE_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const mockProfileLookup = vi.fn();
const mockProfileUpdate = vi.fn<() => Promise<{ error: { message: string } | null }>>();
const mockRoleLookup = vi.fn();
const mockCurrentRoleRow = vi.fn();
const mockRoleUpdate = vi.fn<() => Promise<{ error: { message: string } | null }>>();
const mockAdminCount = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/shared/lib/auth/get-session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({})),
}));

vi.mock("@/shared/lib/audit/record-audit", () => ({ recordAudit: vi.fn() }));

vi.mock("@/shared/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from(table: string) {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: (): ReturnType<typeof mockProfileLookup> => mockProfileLookup(),
            }),
          }),
          update: (): { eq: () => ReturnType<typeof mockProfileUpdate> } => ({
            eq: () => mockProfileUpdate(),
          }),
        };
      }
      if (table === "roles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: (): ReturnType<typeof mockRoleLookup> => mockRoleLookup(),
            }),
          }),
        };
      }
      if (table === "user_roles") {
        return {
          select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head === true) {
              return {
                eq: (): ReturnType<typeof mockAdminCount> => mockAdminCount(),
              };
            }
            return {
              eq: () => ({
                maybeSingle: (): ReturnType<typeof mockCurrentRoleRow> => mockCurrentRoleRow(),
              }),
            };
          },
          update: (): { eq: () => ReturnType<typeof mockRoleUpdate> } => ({
            eq: () => mockRoleUpdate(),
          }),
        };
      }
      return {};
    },
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]): void => {
    mockRevalidatePath(...args);
  },
}));

function validFormData(overrides: Partial<Record<string, string>> = {}): FormData {
  const fd = new FormData();
  fd.set("userId", overrides.userId ?? TARGET_ID);
  fd.set("firstName", overrides.firstName ?? "Nuevo");
  fd.set("lastName", overrides.lastName ?? "Nombre");
  fd.set("documentNumber", overrides.documentNumber ?? "1000000000");
  fd.set("phone", overrides.phone ?? "3001234567");
  fd.set("roleId", overrides.roleId ?? USER_ROLE_ID);
  return fd;
}

describe("updateUserByAdminAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue({
      userId: ADMIN_ID,
      email: "admin@test.com",
      fullName: "Admin",
      roleId: ADMIN_ROLE_ID,
      roleSlug: "admin",
      roleName: "Administrador",
      permissions: ["users.update"],
      role: "admin",
    });
    mockProfileLookup.mockResolvedValue({ data: { email: "target@test.local" }, error: null });
    mockProfileUpdate.mockResolvedValue({ error: null });
    mockRoleLookup.mockResolvedValue({ data: { id: USER_ROLE_ID, slug: "user" }, error: null });
    mockCurrentRoleRow.mockResolvedValue({
      data: { role_id: USER_ROLE_ID, roles: { slug: "user" } },
      error: null,
    });
    mockRoleUpdate.mockResolvedValue({ error: null });
    mockAdminCount.mockResolvedValue({ count: 2, error: null });
  });

  it("returns error when caller lacks users.update", async () => {
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue({
      userId: ADMIN_ID,
      email: "user@test.com",
      fullName: "User",
      roleId: USER_ROLE_ID,
      roleSlug: "user",
      roleName: "Usuario",
      permissions: ["documents.read"],
      role: "user",
    });

    const { updateUserByAdminAction } = await import("../actions/update-user.action");
    const result = await updateUserByAdminAction(null, validFormData());

    expect(result).toEqual({ status: "error", message: "No tienes permiso para editar usuarios." });
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("returns error when admin tries to edit their own account", async () => {
    const { updateUserByAdminAction } = await import("../actions/update-user.action");
    const result = await updateUserByAdminAction(null, validFormData({ userId: ADMIN_ID }));

    expect(result).toEqual({
      status: "error",
      message: "No puedes editar tu propia cuenta desde aquí.",
    });
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("returns error when demoting the last admin", async () => {
    mockCurrentRoleRow.mockResolvedValue({
      data: { role_id: ADMIN_ROLE_ID, roles: { slug: "admin" } },
      error: null,
    });
    mockAdminCount.mockResolvedValue({ count: 1, error: null });

    const { updateUserByAdminAction } = await import("../actions/update-user.action");
    const result = await updateUserByAdminAction(null, validFormData());

    expect(result).toEqual({
      status: "error",
      message: "No puedes quitar el rol al único administrador del sistema.",
    });
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("updates profile fields and role when data is valid", async () => {
    const { updateUserByAdminAction } = await import("../actions/update-user.action");
    const result = await updateUserByAdminAction(null, validFormData());

    expect(result).toEqual({ status: "success", message: "Usuario actualizado correctamente." });
    expect(mockProfileUpdate).toHaveBeenCalled();
    expect(mockRoleUpdate).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users");
  });

  it("returns validation error for a too-short document number", async () => {
    const { updateUserByAdminAction } = await import("../actions/update-user.action");
    const result = await updateUserByAdminAction(null, validFormData({ documentNumber: "12" }));

    expect(result.status).toBe("error");
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("returns error when the target user does not exist", async () => {
    mockProfileLookup.mockResolvedValue({ data: null, error: null });

    const { updateUserByAdminAction } = await import("../actions/update-user.action");
    const result = await updateUserByAdminAction(null, validFormData());

    expect(result).toEqual({
      status: "error",
      message: "El usuario no existe o ya fue eliminado.",
    });
  });
});
