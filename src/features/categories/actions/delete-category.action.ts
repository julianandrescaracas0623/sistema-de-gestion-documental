"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { getRoleForUser } from "@/shared/lib/auth/get-role-for-user";
import { createClient } from "@/shared/lib/supabase/server";

const deleteCategorySchema = z.object({
  id: z.string().uuid("ID inválido."),
});

export async function deleteCategoryAction(
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

  const parsed = deleteCategorySchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "ID inválido." };
  }

  const role = await getRoleForUser(supabase, user.id);
  if (role !== "admin") {
    return { status: "error", message: "Solo los administradores pueden eliminar categorías." };
  }

  const { count: docCount, error: countError } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("category_id", parsed.data.id)
    .is("deleted_at", null);

  if (countError !== null) {
    return { status: "error", message: "No se pudo verificar los documentos asociados." };
  }

  if ((docCount ?? 0) > 0) {
    return {
      status: "error",
      message: `No se puede eliminar: tiene ${String(docCount)} documento(s) asociado(s). Reasigna o elimina los documentos primero.`,
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", parsed.data.id);

  if (error !== null) {
    return { status: "error", message: "No se pudo eliminar la categoría." };
  }

  revalidatePath("/admin/categories");
  return { status: "success", message: "Categoría eliminada correctamente." };
}
