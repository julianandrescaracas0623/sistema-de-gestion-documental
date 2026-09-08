import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TagForm } from "@/features/tags/components/TagForm";

vi.mock("@/features/tags/actions/create-tag.action", () => ({ createTagAction: vi.fn() }));
vi.mock("@/features/tags/actions/update-tag.action", () => ({ updateTagAction: vi.fn() }));

describe("TagForm", () => {
  it("opens a create dialog from its trigger with an empty field", async () => {
    const user = userEvent.setup();
    render(<TagForm mode="create" trigger={<button type="button">Nueva etiqueta</button>} />);

    await user.click(screen.getByRole("button", { name: "Nueva etiqueta" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Nueva etiqueta");
    expect(screen.getByLabelText(/nombre/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
  });

  it("renders the edit dialog prefilled and controlled", () => {
    const noop = vi.fn();
    render(
      <TagForm mode="edit" tag={{ id: "t1", name: "urgente" }} open onOpenChange={noop} />
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("Editar etiqueta");
    expect(screen.getByLabelText(/nombre/i)).toHaveValue("urgente");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();
  });
});
