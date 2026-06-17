"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  auth_error:
    "No se pudo validar el enlace de acceso. Si venías de un correo de recuperación, solicita uno nuevo.",
  no_code: "El enlace de acceso no es válido o está incompleto.",
};

export function LoginAuthErrorNotice() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error === null || !(error in MESSAGES)) {
    return null;
  }

  return (
    <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {MESSAGES[error]}
    </p>
  );
}
