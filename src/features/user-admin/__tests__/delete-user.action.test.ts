import { describe, it, expect, vi, beforeEach } from "vitest";

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const TARGET_ID = "550e8400-e29b-41d4-a716-446655440000";
const LAST_ADMIN_ID = "22222222-2222-2222-2222-222222222222";
const ADMIN_ROLE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const mockDeleteUser = vi.fn();
const mockDeleteProfile = vi.fn();
const mockRevalidatePath = vi.fn();
const mockAdminCount = vi.fn();
const mockTargetRole = vi.fn();
const mockAdminRoleLookup = vi.fn();

vi.mock("@/shared/lib/auth/get-session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(() => ({
    auth: {
      admin: {
        deleteUser: mockDeleteUser,
      },
    },
    from(table: string) {
      if (table === "profiles") {
        return {
          delete: () => ({
            eq: (): Promise<{ error: null }> => {
              void mockDeleteProfile();
              return Promise.resolve({ error: null });
            },
          }),
        };
      }
      if (table === "roles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockAdminRoleLookup,
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
                limit: () => ({
                  maybeSingle: (): ReturnType<typeof mockTargetRole> => mockTargetRole(),
                }),
              }),
            };
          },
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

describe("deleteUserByAdminAction", () => {
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
      permissions: ["users.delete"],
      role: "admin",
    });
    mockAdminRoleLookup.mockResolvedValue({ data: { id: ADMIN_ROLE_ID }, error: null });
    mockDeleteUser.mockResolvedValue({ error: null });
    mockAdminCount.mockResolvedValue({ count: 2, error: null });
    mockTargetRole.mockResolvedValue({
      data: { roles: { slug: "user" } },
      error: null,
    });
  });

  it("returns error when caller lacks users.delete", async () => {
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue({
      userId: ADMIN_ID,
      email: "user@test.com",
      fullName: "User",
      roleId: ADMIN_ROLE_ID,
      roleSlug: "user",
      roleName: "Usuario",
      permissions: ["documents.read"],
      role: "user",
    });

    const { deleteUserByAdminAction } = await import("../actions/delete-user.action");
    const fd = new FormData();
    fd.set("userId", TARGET_ID);

    const result = await deleteUserByAdminAction(null, fd);

    expect(result).toEqual({ status: "error", message: "No tienes permiso para eliminar usuarios." });
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("returns error when admin tries to delete themselves", async () => {
    const { deleteUserByAdminAction } = await import("../actions/delete-user.action");
    const fd = new FormData();
    fd.set("userId", ADMIN_ID);

    const result = await deleteUserByAdminAction(null, fd);

    expect(result).toEqual({ status: "error", message: "No puedes eliminar tu propia cuenta." });
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("returns error when deleting the last admin", async () => {
    mockAdminCount.mockResolvedValue({ count: 1, error: null });
    mockTargetRole.mockResolvedValue({
      data: { roles: { slug: "admin" } },
      error: null,
    });

    const { deleteUserByAdminAction } = await import("../actions/delete-user.action");
    const fd = new FormData();
    fd.set("userId", LAST_ADMIN_ID);

    const result = await deleteUserByAdminAction(null, fd);

    expect(result).toEqual({
      status: "error",
      message: "No puedes eliminar al único administrador del sistema.",
    });
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("deletes user when admin and target is valid", async () => {
    const { deleteUserByAdminAction } = await import("../actions/delete-user.action");
    const fd = new FormData();
    fd.set("userId", TARGET_ID);

    const result = await deleteUserByAdminAction(null, fd);

    expect(result).toEqual({ status: "success", message: "Usuario eliminado correctamente." });
    expect(mockDeleteUser).toHaveBeenCalledWith(TARGET_ID);
    expect(mockDeleteProfile).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/documents");
  });

  it("returns error when auth delete fails", async () => {
    mockDeleteUser.mockResolvedValue({ error: { message: "User not found" } });

    const { deleteUserByAdminAction } = await import("../actions/delete-user.action");
    const fd = new FormData();
    fd.set("userId", TARGET_ID);

    const result = await deleteUserByAdminAction(null, fd);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.message).toContain("No se pudo eliminar");
    }
    expect(mockDeleteProfile).not.toHaveBeenCalled();
  });
});
