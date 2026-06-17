"use client";

import { useSearchParams } from "next/navigation";

export function ForgotPasswordErrorNotice() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error !== "expired") {
    return null;
  }

  return (
    <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      El enlace de recuperación expiró o ya fue usado. Solicita uno nuevo.
    </p>
  );
}
