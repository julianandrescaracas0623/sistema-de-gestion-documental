import { describe, it, expect, vi, beforeEach } from "vitest";

const mockResetPasswordForEmail = vi.fn();
const mockSyncProfileNameToAuthMetadata = vi.fn();
const mockCreateServiceRoleClient = vi.fn();

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { resetPasswordForEmail: mockResetPasswordForEmail },
    }),
  ),
}));

vi.mock("@/shared/lib/supabase/service-role", () => ({
  createServiceRoleClient: mockCreateServiceRoleClient,
}));

vi.mock("@/features/auth/lib/sync-profile-name-to-auth-metadata", () => ({
  syncProfileNameToAuthMetadata: mockSyncProfileNameToAuthMetadata,
}));

describe("requestPasswordResetAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateServiceRoleClient.mockReturnValue({});
    mockSyncProfileNameToAuthMetadata.mockResolvedValue(undefined);
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it("returns error when email is invalid", async () => {
    const { requestPasswordResetAction } = await import(
      "../actions/request-password-reset.action"
    );
    const fd = new FormData();
    fd.set("email", "not-an-email");

    const result = await requestPasswordResetAction(null, fd);

    expect(result.status).toBe("error");
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("syncs profile name and sends reset email on valid email", async () => {
    const { requestPasswordResetAction } = await import(
      "../actions/request-password-reset.action"
    );
    const fd = new FormData();
    fd.set("email", "maria@ips.com");

    const result = await requestPasswordResetAction(null, fd);

    expect(mockSyncProfileNameToAuthMetadata).toHaveBeenCalledWith({}, "maria@ips.com");
    expect(mockResetPasswordForEmail).toHaveBeenCalled();
    const resetOptions = mockResetPasswordForEmail.mock.calls[0]?.[1] as {
      redirectTo: string;
    };
    expect(resetOptions.redirectTo).toContain("/api/auth/callback?next=/reset-password");
    expect(result).toEqual({
      status: "success",
      message:
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
    });
  });

  it("still sends reset email when service role sync fails", async () => {
    mockCreateServiceRoleClient.mockImplementation(() => {
      throw new Error("missing service role");
    });

    const { requestPasswordResetAction } = await import(
      "../actions/request-password-reset.action"
    );
    const fd = new FormData();
    fd.set("email", "maria@ips.com");

    const result = await requestPasswordResetAction(null, fd);

    expect(mockSyncProfileNameToAuthMetadata).not.toHaveBeenCalled();
    expect(mockResetPasswordForEmail).toHaveBeenCalled();
    expect(result.status).toBe("success");
  });

  it("returns error when reset email fails", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: "rate limit" } });

    const { requestPasswordResetAction } = await import(
      "../actions/request-password-reset.action"
    );
    const fd = new FormData();
    fd.set("email", "maria@ips.com");

    const result = await requestPasswordResetAction(null, fd);

    expect(result).toEqual({
      status: "error",
      message: "No se pudo enviar el correo. Intenta de nuevo más tarde.",
    });
  });
});
