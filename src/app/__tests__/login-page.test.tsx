import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import LoginPage from "../(auth)/login/page";

vi.mock("@/features/auth/components/login-form", () => ({
  LoginForm: () => <div data-testid="login-form" />,
}));

// These are "use client" components that read the router / search params on
// render; they contribute nothing to what this page test asserts.
vi.mock("@/features/auth/components/login-auth-hash-handler", () => ({
  LoginAuthHashHandler: () => null,
}));
vi.mock("@/features/auth/components/login-auth-error-notice", () => ({
  LoginAuthErrorNotice: () => null,
}));
vi.mock("@/features/auth/components/login-reset-success-notice", () => ({
  LoginResetSuccessNotice: () => null,
}));

describe("LoginPage", () => {
  it("renders the welcome heading in Spanish", () => {
    // Arrange + Act
    render(<LoginPage />);

    // Assert
    expect(screen.getByText(/bienvenido de nuevo/i)).toBeInTheDocument();
  });

  it("renders the LoginForm component", () => {
    // Arrange + Act
    render(<LoginPage />);

    // Assert
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("renders the sign-in description in Spanish", () => {
    // Arrange + Act
    render(<LoginPage />);

    // Assert
    expect(screen.getByText(/solicita el alta con un administrador/i)).toBeInTheDocument();
  });
});
