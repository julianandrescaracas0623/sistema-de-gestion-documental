import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExchangeCodeForSession = vi.fn();
const mockVerifyOtp = vi.fn();
const mockGetResponse = vi.fn();

vi.mock("@/shared/lib/supabase/route-handler-client", () => ({
  createRouteHandlerClient: vi.fn((redirectUrl: string) => ({
    supabase: {
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
        verifyOtp: mockVerifyOtp,
      },
    },
    getResponse: (): Response => mockGetResponse(redirectUrl) as Response,
  })),
}));

describe("auth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetResponse.mockImplementation((url: string) =>
      Response.redirect(url, 307),
    );
  });

  it("redirects to /login with error when code and token_hash are missing", async () => {
    const { GET } = await import("../api/auth/callback/route");
    const req = new Request("http://localhost/api/auth/callback");

    const response = await GET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?error=no_code");
  });

  it("redirects to /login with error when code exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: { message: "bad code" } });
    const { GET } = await import("../api/auth/callback/route");
    const req = new Request("http://localhost/api/auth/callback?code=bad-code");

    const response = await GET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?error=auth_error");
  });

  it("redirects to next param on successful code exchange", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("../api/auth/callback/route");
    const req = new Request(
      "http://localhost/api/auth/callback?code=valid-code&next=/reset-password",
    );

    const response = await GET(req);

    expect(mockGetResponse).toHaveBeenCalledWith("http://localhost/reset-password");
    expect(response.headers.get("location")).toBe("http://localhost/reset-password");
  });

  it("redirects to / on successful code exchange without next", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("../api/auth/callback/route");
    const req = new Request("http://localhost/api/auth/callback?code=valid-code");

    const response = await GET(req);

    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("ignores protocol-relative next param to prevent open redirect", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("../api/auth/callback/route");
    const req = new Request("http://localhost/api/auth/callback?code=valid-code&next=//evil.com");

    await GET(req);

    expect(mockGetResponse).toHaveBeenCalledWith("http://localhost/");
  });

  it("redirects to /reset-password on successful token_hash recovery", async () => {
    mockVerifyOtp.mockResolvedValue({ error: null });
    const { GET } = await import("../api/auth/callback/route");
    const req = new Request(
      "http://localhost/api/auth/callback?token_hash=abc123&type=recovery&next=/reset-password",
    );

    const response = await GET(req);

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      type: "recovery",
      token_hash: "abc123",
    });
    expect(response.headers.get("location")).toBe("http://localhost/reset-password");
  });

  it("redirects to forgot-password when token_hash recovery fails", async () => {
    mockVerifyOtp.mockResolvedValue({ error: { message: "expired" } });
    const { GET } = await import("../api/auth/callback/route");
    const req = new Request(
      "http://localhost/api/auth/callback?token_hash=bad&type=recovery&next=/reset-password",
    );

    const response = await GET(req);

    expect(response.headers.get("location")).toContain("/forgot-password?error=expired");
  });
});
