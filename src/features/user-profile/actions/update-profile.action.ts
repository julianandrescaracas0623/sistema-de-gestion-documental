"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { getSession } from "@/shared/lib/auth/get-session";
import { formFieldText } from "@/shared/lib/form-utils";
import { createClient } from "@/shared/lib/supabase/server";

const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(60, "El nombre es demasiado largo"),
  lastName: z
    .string()
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(60, "El apellido es demasiado largo"),
  documentNumber: z
    .string()
    .trim()
    .min(4, "El número de documento debe tener al menos 4 caracteres")
    .max(20, "El número de documento es demasiado largo"),
  phone: z
    .string()
    .trim()
    .min(7, "El teléfono debe tener al menos 7 caracteres")
    .max(20, "El teléfono es demasiado largo"),
});

export async function updateOwnProfileAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse({
    firstName: formFieldText(formData, "firstName"),
    lastName: formFieldText(formData, "lastName"),
    documentNumber: formFieldText(formData, "documentNumber"),
    phone: formFieldText(formData, "phone"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const session = await getSession();
  if (session === null) {
    return { status: "error", message: "Debes iniciar sesión." };
  }

  const { firstName, lastName, documentNumber, phone } = parsed.data;

  const supabase = await createClient();
  // Explicit .eq("id", userId) as defense in depth — don't rely on RLS alone.
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      document_number: documentNumber,
      phone,
    })
    .eq("id", session.userId);

  if (error !== null) {
    return { status: "error", message: "No se pudo actualizar tu perfil. Intenta de nuevo." };
  }

  revalidatePath("/perfil");
  revalidatePath("/");
  return { status: "success", message: "Perfil actualizado correctamente." };
}
