import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { UserRowActions } from "@/features/user-admin/components/user-row-actions";
import type { RoleOption, UserAdminRow } from "@/features/user-admin/queries/users.queries";

const mockRefresh = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/features/user-admin/actions/delete-user.action", () => ({
  deleteUserByAdminAction: (...args: unknown[]): ReturnType<typeof mockDeleteUser> =>
    mockDeleteUser(...args),
}));

vi.mock("@/features/user-admin/actions/update-user.action", () => ({
  updateUserByAdminAction: vi.fn(),
}));

const user: UserAdminRow = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "user@test.local",
  fullName: "Test User",
  roleId: "33333333-3333-3333-3333-333333333333",
  roleSlug: "user",
  roleName: "Usuario",
  created_at: "2026-01-01T00:00:00Z",
};

const roles: RoleOption[] = [
  { id: "33333333-3333-3333-3333-333333333333", slug: "user", name: "Usuario" },
  { id: "44444444-4444-4444-4444-444444444444", slug: "admin", name: "Administrador" },
];

describe("UserRowActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Tu cuenta' for the current admin's own row", () => {
    render(<UserRowActions user={user} roles={roles} currentAdminId={user.id} />);
    expect(screen.getByText("Tu cuenta")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument();
  });

  it("opens the confirm dialog with the user email", async () => {
    const account = userEvent.setup();
    render(<UserRowActions user={user} roles={roles} currentAdminId="other" />);

    await account.click(screen.getByRole("button", { name: /eliminar usuario user@test\.local/i }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/documentos permanecerán/i)).toBeInTheDocument();
  });

  it("opens the edit dialog with the current name and role", async () => {
    const account = userEvent.setup();
    render(<UserRowActions user={user} roles={roles} currentAdminId="other" />);

    await account.click(screen.getByRole("button", { name: /editar usuario user@test\.local/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
  });

  it("hides both actions when the user lacks permissions", () => {
    render(
      <UserRowActions
        user={user}
        roles={roles}
        currentAdminId="other"
        canUpdate={false}
        canDelete={false}
      />
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
