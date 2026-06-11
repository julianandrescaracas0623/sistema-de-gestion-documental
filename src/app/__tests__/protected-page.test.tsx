import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/shared/lib/auth/get-session", () => ({
  getSession: (): unknown => mockGetSession(),
}));

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: vi.fn() },
      from: vi.fn(),
    })
  ),
}));

vi.mock("@/features/documents/queries/documents.queries", () => ({
  countDocuments: vi.fn(() => Promise.resolve({ count: 0, error: null })),
  listRecentDocuments: vi.fn(() => Promise.resolve({ data: [], error: null })),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): unknown => mockRedirect(url),
}));

describe("HomePage (protected)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      userId: "u1",
      email: "user@example.com",
      fullName: "Usuario Test",
      roleId: "role-1",
      roleSlug: "user",
      roleName: "Usuario administrativo",
      permissions: ["documents.read", "documents.create"],
      role: "user",
    });
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const { default: HomePage } = await import("../(protected)/page");

    await HomePage();

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("renders dashboard when user is authenticated", async () => {
    const { default: HomePage } = await import("../(protected)/page");

    const result = await HomePage();

    expect(result).toBeTruthy();
  });
});
