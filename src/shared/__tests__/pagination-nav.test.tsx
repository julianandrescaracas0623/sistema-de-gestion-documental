import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PaginationNav, pageItems } from "@/shared/components/pagination-nav";

describe("pageItems", () => {
  it("lists every page when there are 7 or fewer", () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("windows around the current page with ellipses for large counts", () => {
    expect(pageItems(1, 20)).toEqual([1, 2, "ellipsis", 20]);
    expect(pageItems(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
    expect(pageItems(20, 20)).toEqual([1, "ellipsis", 19, 20]);
  });
});

describe("PaginationNav", () => {
  it("renders nothing for a single page", () => {
    const { container } = render(<PaginationNav page={1} totalPages={1} buildHref={String} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("marks the current page and disables the boundary arrow", () => {
    render(<PaginationNav page={1} totalPages={5} buildHref={(p) => `/x?page=${String(p)}`} />);
    expect(screen.getByRole("link", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
    // client variant renders buttons; server variant renders links — prev is a link here
    expect(screen.getByLabelText("Página anterior")).toHaveClass("pointer-events-none");
  });
});
