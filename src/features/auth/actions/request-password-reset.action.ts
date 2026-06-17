"use server";

import { z } from "zod";

import { syncProfileNameToAuthMetadata } from "@/features/auth/lib/sync-profile-name-to-auth-metadata";
import type { ActionResult } from "@/shared/lib/action-result";
import { formFieldText } from "@/shared/lib/form-utils";
import { createClient } from "@/shared/lib/supabase/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/service-role";

const schema = z.object({
  email: z.string().email("Correo electrónico inválido."),
});

function getResetRedirectUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${siteUrl.replace(/\/$/, "")}/api/auth/callback?next=/reset-password`;
}

export async function requestPasswordResetAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = schema.safeParse({ email: formFieldText(formData, "email") });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Correo inválido.",
    };
  }

  try {
    const adminClient = createServiceRoleClient();
    await syncProfileNameToAuthMetadata(adminClient, parsed.data.email);
  } catch {
    // Reset still works without personalized greeting for legacy users.
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: getResetRedirectUrl(),
  });

  if (error !== null) {
    return {
      status: "error",
      message: "No se pudo enviar el correo. Intenta de nuevo más tarde.",
    };
  }

  return {
    status: "success",
    message:
      "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
  };
}
