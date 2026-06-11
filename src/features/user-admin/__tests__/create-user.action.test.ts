import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();
const mockUpsert = vi.fn();
const mockInsert = vi.fn();
const mockRoleLookup = vi.fn();

const ROLE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

vi.mock("@/shared/lib/auth/get-session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(() => ({
    auth: {
      admin: {
        createUser: mockCreateUser,
        deleteUser: mockDeleteUser,
      },
    },
    from(table: string) {
      if (table === "profiles") {
        return {
          upsert: mockUpsert,
          delete: () => ({
            eq: (): Promise<{ error: null }> => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === "user_roles") {
        return { insert: mockInsert };
      }
      if (table === "roles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockRoleLookup,
            }),
          }),
        };
      }
      return { insert: mockInsert, upsert: mockUpsert };
    },
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("createUserByAdminAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue({
      userId: "admin-1",
      email: "admin@test.com",
      fullName: "Admin",
      roleId: ROLE_ID,
      roleSlug: "admin",
      roleName: "Administrador",
      permissions: ["users.manage"],
      role: "admin",
    });
    mockRoleLookup.mockResolvedValue({ data: { id: ROLE_ID }, error: null });
    mockCreateUser.mockResolvedValue({
      data: { user: { id: "new-user-1" } },
      error: null,
    });
    mockUpsert.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("returns error when caller lacks users.manage", async () => {
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue({
      userId: "user-1",
      email: "user@test.com",
      fullName: "User",
      roleId: ROLE_ID,
      roleSlug: "user",
      roleName: "Usuario",
      permissions: ["documents.read"],
      role: "user",
    });

    const { createUserByAdminAction } = await import("../actions/create-user.action");
    const fd = new FormData();
    fd.set("fullName", "Nuevo Usuario");
    fd.set("email", "new@example.com");
    fd.set("password", "password123");
    fd.set("roleId", ROLE_ID);

    const result = await createUserByAdminAction({ status: "idle" }, fd);

    expect(result).toEqual({ status: "error", message: "No tienes permiso para crear usuarios." });
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("returns error when not authenticated", async () => {
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { createUserByAdminAction } = await import("../actions/create-user.action");
    const fd = new FormData();
    fd.set("fullName", "Nuevo Usuario");
    fd.set("email", "new@example.com");
    fd.set("password", "password123");
    fd.set("roleId", ROLE_ID);

    const result = await createUserByAdminAction({ status: "idle" }, fd);

    expect(result).toEqual({ status: "error", message: "Debes iniciar sesión como administrador." });
  });

  it("returns validation error for short password", async () => {
    const { createUserByAdminAction } = await import("../actions/create-user.action");
    const fd = new FormData();
    fd.set("fullName", "Nuevo Usuario");
    fd.set("email", "new@example.com");
    fd.set("password", "short");
    fd.set("roleId", ROLE_ID);

    const result = await createUserByAdminAction({ status: "idle" }, fd);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.message).toContain("8 caracteres");
    }
  });

  it("requires fullName", async () => {
    const { createUserByAdminAction } = await import("../actions/create-user.action");
    const fd = new FormData();
    fd.set("fullName", "A");
    fd.set("email", "new@example.com");
    fd.set("password", "password123");
    fd.set("roleId", ROLE_ID);

    const result = await createUserByAdminAction({ status: "idle" }, fd);

    expect(result.status).toBe("error");
  });

  it("creates user when admin and data valid", async () => {
    const { createUserByAdminAction } = await import("../actions/create-user.action");
    const fd = new FormData();
    fd.set("fullName", "Nuevo Usuario");
    fd.set("email", "new@example.com");
    fd.set("password", "password123");
    fd.set("roleId", ROLE_ID);

    const result = await createUserByAdminAction({ status: "idle" }, fd);

    expect(result).toEqual({ status: "success" });
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        password: "password123",
        email_confirm: true,
        user_metadata: { full_name: "Nuevo Usuario" },
      })
    );
    expect(mockUpsert).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
  });

  it("rolls back auth user when profile upsert fails", async () => {
    mockUpsert.mockResolvedValue({ error: { message: "db error" } });
    const { createUserByAdminAction } = await import("../actions/create-user.action");
    const fd = new FormData();
    fd.set("fullName", "Nuevo Usuario");
    fd.set("email", "new@example.com");
    fd.set("password", "password123");
    fd.set("roleId", ROLE_ID);

    const result = await createUserByAdminAction({ status: "idle" }, fd);

    expect(result.status).toBe("error");
    expect(mockDeleteUser).toHaveBeenCalledWith("new-user-1");
  });
});
