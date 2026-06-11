"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasPermission } from "@/shared/lib/auth/permissions";
import { CACHE_TAGS } from "@/shared/lib/cache/cached-queries";
import { createClient } from "@/shared/lib/supabase/server";

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(120, "El nombre es demasiado largo."),
  description: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().trim().max(500).optional()
  ),
});

export async function createCategoryAction(
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

  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const session = await getSession();
  if (session === null || !hasPermission(session.permissions, "categories.manage")) {
    return { status: "error", message: "No tienes permiso para crear categorías." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", parsed.data.name)
    .maybeSingle();
  if (existingError !== null) {
    return { status: "error", message: "No se pudo validar el nombre de la categoría." };
  }

  if (existing !== null) {
    return { status: "error", message: "Ya existe una categoría con ese nombre." };
  }

  const { error } = await supabase.from("categories").insert({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    created_by: user.id,
  });

  if (error !== null) {
    return { status: "error", message: "No se pudo crear la categoría." };
  }

  revalidatePath("/admin/categories");
  revalidateTag(CACHE_TAGS.categories, "default");
  return { status: "success", message: "Categoría creada correctamente." };
}
