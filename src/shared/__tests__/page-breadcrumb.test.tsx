import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageBreadcrumb } from "../components/page-breadcrumb";

describe("PageBreadcrumb", () => {
  it("renders navigation with aria-label", () => {
    render(
      <PageBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Documentos" },
        ]}
      />
    );

    expect(screen.getByRole("navigation", { name: "Ruta de navegación" })).toBeInTheDocument();
  });

  it("renders links for items with href", () => {
    render(
      <PageBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Documentos", href: "/documents" },
          { label: "Subir" },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Documentos" })).toHaveAttribute("href", "/documents");
  });

  it("marks the current page without a link", () => {
    render(
      <PageBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Documentos" },
        ]}
      />
    );

    const current = screen.getByText("Documentos");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Documentos" })).not.toBeInTheDocument();
  });
});
