"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { recordAudit } from "@/shared/lib/audit/record-audit";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasModulePermission } from "@/shared/lib/auth/permissions";
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

  const session = await getSession();
  if (session === null || !hasModulePermission(session.permissions, "categories", "update")) {
    return { status: "error", message: "No tienes permiso para editar categorías." };
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

  const { data: updated, error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .select("id");

  if (error !== null) {
    if (error.code === "23505") {
      return { status: "error", message: "Ya existe otra categoría con ese nombre." };
    }
    return { status: "error", message: "No se pudo actualizar la categoría." };
  }
  if (updated.length === 0) {
    return { status: "error", message: "No se pudo actualizar la categoría (sin permiso o no existe)." };
  }

  await recordAudit(supabase, {
    action: "category.update",
    entityType: "category",
    entityId: parsed.data.id,
    summary: parsed.data.name,
  });

  revalidatePath("/admin/categories");
  revalidateTag(CACHE_TAGS.categories, "default");
  return { status: "success", message: "Categoría actualizada correctamente." };
}
