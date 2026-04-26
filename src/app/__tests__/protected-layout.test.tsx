import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockRedirect = vi.fn();
const mockGetRoleForUser = vi.fn();

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    })
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): unknown => mockRedirect(url),
}));

vi.mock("@/shared/lib/auth/get-role-for-user", () => ({
  getRoleForUser: (...args: unknown[]): unknown => mockGetRoleForUser(...args),
}));

describe("ProtectedLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRoleForUser.mockResolvedValue("user");
  });

  it("renders children when user is authenticated", async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "user@example.com" } } });
    const { default: ProtectedLayout } = await import("../(protected)/layout");

    // Act
    const result = await ProtectedLayout({ children: <div data-testid="child" /> });

    // Assert
    expect(result).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to /login when user is not authenticated", async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { default: ProtectedLayout } = await import("../(protected)/layout");

    // Act
    await ProtectedLayout({ children: <div /> });

    // Assert
    expect(mockRedirect).toHaveBeenCalledWith("/login");
    expect(mockGetRoleForUser).not.toHaveBeenCalled();
  });
});
