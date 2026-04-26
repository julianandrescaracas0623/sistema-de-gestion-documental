import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ auth: { getUser: mockGetUser } })
  ),
}));

const mockGetRoleForUser = vi.fn();
vi.mock("@/shared/lib/auth/get-role-for-user", () => ({
  getRoleForUser: (...args: unknown[]): unknown => mockGetRoleForUser(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): unknown => mockRedirect(url),
}));

describe("HomePage (protected)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRoleForUser.mockResolvedValue("user");
  });

  it("redirects to /login when user is not authenticated", async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { default: HomePage } = await import("../(protected)/page");

    // Act
    await HomePage();

    // Assert
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  }, 10000);

  it("renders dashboard when user is authenticated", async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "user@example.com" } } });
    const { default: HomePage } = await import("../(protected)/page");

    // Act
    const result = await HomePage();

    // Assert
    expect(result).toBeTruthy();
  }, 10000);
});
