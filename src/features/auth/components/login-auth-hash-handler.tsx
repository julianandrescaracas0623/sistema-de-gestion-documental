"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Supabase sends auth errors in the URL hash (#error_code=otp_expired) when
 * verification fails before reaching /api/auth/callback (e.g. old ConfirmationURL flow).
 */
export function LoginAuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    if (hash === "") return;

    const params = new URLSearchParams(hash);
    const errorCode = params.get("error_code");

    if (errorCode === "otp_expired" || errorCode === "otp_disabled") {
      router.replace("/forgot-password?error=expired");
      return;
    }

    if (params.get("error") === "access_denied") {
      router.replace("/login?error=auth_error");
    }
  }, [router]);

  return null;
}
