import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { DeleteUserButton } from "@/features/user-admin/components/delete-user-button";

const mockRefresh = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/features/user-admin/actions/delete-user.action", () => ({
  deleteUserByAdminAction: (...args: unknown[]): ReturnType<typeof mockDeleteUser> =>
    mockDeleteUser(...args),
}));

describe("DeleteUserButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens confirm dialog with user email from menu", async () => {
    const user = userEvent.setup();

    render(<DeleteUserButton userId="11111111-1111-1111-1111-111111111111" email="user@test.local" />);

    await user.click(screen.getByRole("button", { name: "Abrir menú de acciones" }));
    await user.click(screen.getByRole("menuitem", { name: /eliminar/i }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("user@test.local")).toBeInTheDocument();
    expect(screen.getByText(/documentos permanecerán/i)).toBeInTheDocument();
  });
});
