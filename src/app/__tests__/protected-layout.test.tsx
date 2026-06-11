import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/shared/lib/auth/get-session", () => ({
  getSession: (): unknown => mockGetSession(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): unknown => mockRedirect(url),
}));

vi.mock("@/shared/components/ips-app-shell", () => ({
  IpsAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="ips-shell">{children}</div>,
}));

describe("ProtectedLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      userId: "u1",
      email: "user@example.com",
      fullName: "Usuario Test",
      roleId: "role-1",
      roleSlug: "user",
      roleName: "Usuario administrativo",
      permissions: ["documents.read"],
      role: "user",
    });
  });

  it("renders children when user is authenticated", async () => {
    const { default: ProtectedLayout } = await import("../(protected)/layout");

    const result = await ProtectedLayout({ children: <div data-testid="child" /> });

    expect(result).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const { default: ProtectedLayout } = await import("../(protected)/layout");

    await ProtectedLayout({ children: <div /> });

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
