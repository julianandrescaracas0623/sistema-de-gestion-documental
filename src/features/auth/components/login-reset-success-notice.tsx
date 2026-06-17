"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function LoginResetSuccessNotice() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      toast.success("Contraseña actualizada. Ya puedes iniciar sesión con tu nueva clave.");
    }
  }, [searchParams]);

  if (searchParams.get("reset") !== "success") {
    return null;
  }

  return (
    <p
      role="status"
      className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary"
    >
      Contraseña actualizada correctamente. Inicia sesión con tu nueva clave.
    </p>
  );
}
