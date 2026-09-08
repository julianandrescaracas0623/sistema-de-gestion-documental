import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { DocumentRowActions } from "@/features/documents/components/document-row-actions";

vi.mock("@/features/documents/actions/soft-delete-document.action", () => ({
  softDeleteDocumentAction: vi.fn(),
}));

const DOC_ID = "22222222-2222-2222-2222-222222222222";

describe("DocumentRowActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the delete dialog with the document title", async () => {
    const user = userEvent.setup();

    render(<DocumentRowActions documentId={DOC_ID} title="Informe clínico" />);

    await user.click(screen.getByRole("button", { name: /eliminar informe clínico/i }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Informe clínico")).toBeInTheDocument();
  });

  it("renders a view link to the document detail page", () => {
    render(<DocumentRowActions documentId={DOC_ID} title="Informe clínico" />);

    const link = screen.getByRole("link", { name: /ver informe clínico/i });
    expect(link).toHaveAttribute("href", `/documents/${DOC_ID}`);
  });

  it("hides the delete action when the user cannot delete", () => {
    render(<DocumentRowActions documentId={DOC_ID} title="Informe clínico" canDelete={false} />);

    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver/i })).toBeInTheDocument();
  });
});
