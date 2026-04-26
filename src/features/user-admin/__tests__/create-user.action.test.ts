import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();
const mockUpsert = vi.fn();
const mockInsert = vi.fn();
const mockDeleteProfile = vi.fn();

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    })
  ),
}));

const mockGetRoleForUser = vi.fn();
vi.mock("@/shared/lib/auth/get-role-for-user", () => ({
  getRoleForUser: (...args: unknown[]): unknown => mockGetRoleForUser(...args),
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
            eq: (): Promise<{ error: null }> => {
              void mockDeleteProfile();
              return Promise.resolve({ error: null });
            },
          }),
        };
      }
      if (table === "user_roles") {
        return { insert: mockInsert };
      }
      return { insert: mockInsert, upsert: mockUpsert };
    },
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("createUserByAdminAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mockGetRoleForUser.mockResolvedValue("admin");
    mockCreateUser.mockResolvedValue({
      data: { user: { id: "new-user-1" } },
      error: null,
    });
    mockUpsert.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("returns error when caller is not admin", async () => {
    mockGetRoleForUser.mockResolvedValue("user");
    const { createUserByAdminAction } = await import("../actions/create-user.action");
    const fd = new FormData();
    fd.set("email", "new@example.com");
    fd.set("password", "password123");
    fd.set("role", "user");

    const result = await createUserByAdminAction({ status: "idle" }, fd);

    expect(result).toEqual({ status: "error", message: "No tienes permiso para crear usuarios." });
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { createUserByAdminAction } = await import("../actions/create-user.action");
    const fd = new FormData();
    fd.set("email", "new@example.com");
    fd.set("password", "password123");
    fd.set("role", "user");

    const result = await createUserByAdminAction({ status: "idle" }, fd);

    expect(result).toEqual({ status: "error", message: "Debes iniciar sesión como administrador." });
  });

  it("returns validation error for short password", async () => {
    const { createUserByAdminAction } = await import("../actions/create-user.action");
    const fd = new FormData();
    fd.set("email", "new@example.com");
    fd.set("password", "short");
    fd.set("role", "user");

    const result = await createUserByAdminAction({ status: "idle" }, fd);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.message).toContain("8 caracteres");
    }
  });

  it("creates user when admin and data valid", async () => {
    const { createUserByAdminAction } = await import("../actions/create-user.action");
    const fd = new FormData();
    fd.set("email", "new@example.com");
    fd.set("password", "password123");
    fd.set("role", "user");

    const result = await createUserByAdminAction({ status: "idle" }, fd);

    expect(result).toEqual({ status: "success" });
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        password: "password123",
        email_confirm: true,
      })
    );
    expect(mockUpsert).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
  });

  it("rolls back auth user when profile upsert fails", async () => {
    mockUpsert.mockResolvedValue({ error: { message: "db error" } });
    const { createUserByAdminAction } = await import("../actions/create-user.action");
    const fd = new FormData();
    fd.set("email", "new@example.com");
    fd.set("password", "password123");
    fd.set("role", "user");

    const result = await createUserByAdminAction({ status: "idle" }, fd);

    expect(result.status).toBe("error");
    expect(mockDeleteUser).toHaveBeenCalledWith("new-user-1");
  });
});
