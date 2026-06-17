"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { formFieldText } from "@/shared/lib/form-utils";
import { createClient } from "@/shared/lib/supabase/server";

const schema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  confirmPassword: z.string().min(8, "Confirma tu contraseña."),
});

export async function resetPasswordAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  const parsed = schema.safeParse({
    password: formFieldText(formData, "password"),
    confirmPassword: formFieldText(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { status: "error", message: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return {
      status: "error",
      message: "El enlace expiró o no es válido. Solicita uno nuevo.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error !== null) {
    return {
      status: "error",
      message: "No se pudo actualizar la contraseña. Intenta de nuevo.",
    };
  }

  redirect("/login?reset=success");
}
