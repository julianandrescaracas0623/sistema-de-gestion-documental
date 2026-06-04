"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { getRoleForUser } from "@/shared/lib/auth/get-role-for-user";
import { CACHE_TAGS } from "@/shared/lib/cache/cached-queries";
import { createClient } from "@/shared/lib/supabase/server";

const updateCategorySchema = z.object({
  id: z.string().uuid("ID inválido."),
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(120, "El nombre es demasiado largo."),
  description: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().trim().max(500).optional()
  ),
});

export async function updateCategoryAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    return { status: "error", message: "Debes iniciar sesión." };
  }

  const parsed = updateCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const role = await getRoleForUser(supabase, user.id);
  if (role !== "admin") {
    return { status: "error", message: "Solo los administradores pueden editar categorías." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", parsed.data.name)
    .neq("id", parsed.data.id)
    .maybeSingle();
  if (existingError !== null) {
    return { status: "error", message: "No se pudo validar el nombre de la categoría." };
  }

  if (existing !== null) {
    return { status: "error", message: "Ya existe otra categoría con ese nombre." };
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error !== null) {
    return { status: "error", message: "No se pudo actualizar la categoría." };
  }

  revalidatePath("/admin/categories");
  revalidateTag(CACHE_TAGS.categories, "default");
  return { status: "success", message: "Categoría actualizada correctamente." };
}
