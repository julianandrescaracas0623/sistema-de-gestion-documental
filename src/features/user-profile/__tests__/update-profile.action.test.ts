import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "11111111-1111-1111-1111-111111111111";

const mockUpdateEq = vi.fn();
const mockFrom = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));
vi.mock("@/shared/lib/auth/get-session", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]): void => {
    mockRevalidatePath(...args);
  },
}));

function validFormData(overrides: Partial<Record<string, string>> = {}): FormData {
  const fd = new FormData();
  fd.set("firstName", overrides.firstName ?? "Nuevo");
  fd.set("lastName", overrides.lastName ?? "Nombre");
  fd.set("documentNumber", overrides.documentNumber ?? "1000000000");
  fd.set("phone", overrides.phone ?? "3001234567");
  return fd;
}

describe("updateOwnProfileAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue({
      userId: USER_ID,
      email: "user@test.com",
      fullName: "Usuario",
      roleId: "role-1",
      roleSlug: "user",
      roleName: "Usuario",
      permissions: ["documents.read"],
      role: "user",
    });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table !== "profiles") return {};
      return {
        update: () => ({ eq: mockUpdateEq }),
      };
    });
  });

  it("returns error when not authenticated", async () => {
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { updateOwnProfileAction } = await import("../actions/update-profile.action");
    const result = await updateOwnProfileAction(null, validFormData());

    expect(result).toEqual({ status: "error", message: "Debes iniciar sesión." });
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("returns validation error for a too-short phone", async () => {
    const { updateOwnProfileAction } = await import("../actions/update-profile.action");
    const result = await updateOwnProfileAction(null, validFormData({ phone: "123" }));

    expect(result.status).toBe("error");
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("updates the caller's own row and revalidates /perfil", async () => {
    const { updateOwnProfileAction } = await import("../actions/update-profile.action");
    const result = await updateOwnProfileAction(null, validFormData());

    expect(result).toEqual({ status: "success", message: "Perfil actualizado correctamente." });
    expect(mockUpdateEq).toHaveBeenCalledWith("id", USER_ID);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/perfil");
  });

  it("returns error when the update fails", async () => {
    mockUpdateEq.mockResolvedValue({ error: { message: "db error" } });

    const { updateOwnProfileAction } = await import("../actions/update-profile.action");
    const result = await updateOwnProfileAction(null, validFormData());

    expect(result).toEqual({
      status: "error",
      message: "No se pudo actualizar tu perfil. Intenta de nuevo.",
    });
  });
});
