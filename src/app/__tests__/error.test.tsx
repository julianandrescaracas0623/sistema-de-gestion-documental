import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import ErrorPage from "../error";

describe("ErrorPage", () => {
  it("renders error heading", () => {
    const error = new Error("Something failed");
    const reset = vi.fn();

    render(<ErrorPage error={error} reset={reset} />);

    expect(screen.getByText(/algo salió mal/i)).toBeInTheDocument();
  });

  it("renders error message", () => {
    const error = new Error("Specific error message");
    const reset = vi.fn();

    render(<ErrorPage error={error} reset={reset} />);

    expect(screen.getByText("Specific error message")).toBeInTheDocument();
  });

  it("renders Reintentar button", () => {
    const error = new Error("test");
    const reset = vi.fn();

    render(<ErrorPage error={error} reset={reset} />);

    expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });

  it("calls reset when Reintentar is clicked", async () => {
    const error = new Error("test");
    const reset = vi.fn();
    const user = userEvent.setup();
    render(<ErrorPage error={error} reset={reset} />);

    await user.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(reset).toHaveBeenCalledOnce();
  });

  it("logs error to console on mount", () => {
    const error = new Error("logged error");
    const reset = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<ErrorPage error={error} reset={reset} />);

    expect(consoleSpy).toHaveBeenCalledWith(error);
    consoleSpy.mockRestore();
  });
});
