import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDestructiveDialog } from "../components/confirm-destructive-dialog";

describe("ConfirmDestructiveDialog", () => {
  it("renders title and description when open", () => {
    render(
      <ConfirmDestructiveDialog
        open
        onOpenChange={vi.fn()}
        title="Eliminar documento"
        description="¿Seguro que deseas continuar?"
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Eliminar documento")).toBeInTheDocument();
    expect(screen.getByText("¿Seguro que deseas continuar?")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ConfirmDestructiveDialog
        open
        onOpenChange={vi.fn()}
        title="Eliminar"
        description="Descripción"
        confirmLabel="Eliminar"
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("shows pending label when isPending is true", () => {
    render(
      <ConfirmDestructiveDialog
        open
        onOpenChange={vi.fn()}
        title="Eliminar"
        description="Descripción"
        isPending
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Procesando…" })).toBeDisabled();
  });
});
