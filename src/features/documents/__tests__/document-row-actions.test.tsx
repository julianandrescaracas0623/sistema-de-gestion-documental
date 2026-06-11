import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { DocumentRowActions } from "@/features/documents/components/document-row-actions";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/features/documents/actions/soft-delete-document.action", () => ({
  softDeleteDocumentAction: vi.fn(),
}));

describe("DocumentRowActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens delete dialog with document title from menu", async () => {
    const user = userEvent.setup();

    render(
      <DocumentRowActions documentId="22222222-2222-2222-2222-222222222222" title="Informe clínico" />
    );

    await user.click(screen.getByRole("button", { name: "Abrir menú de acciones" }));
    await user.click(screen.getByRole("menuitem", { name: /eliminar/i }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Informe clínico")).toBeInTheDocument();
  });

  it("navigates to document detail when Ver is selected", async () => {
    const user = userEvent.setup();

    render(
      <DocumentRowActions documentId="22222222-2222-2222-2222-222222222222" title="Informe clínico" />
    );

    await user.click(screen.getByRole("button", { name: "Abrir menú de acciones" }));
    await user.click(screen.getByRole("menuitem", { name: /ver/i }));

    expect(mockPush).toHaveBeenCalledWith("/documents/22222222-2222-2222-2222-222222222222");
  });
});
