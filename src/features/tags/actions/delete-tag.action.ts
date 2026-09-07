"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { recordAudit } from "@/shared/lib/audit/record-audit";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasModulePermission } from "@/shared/lib/auth/permissions";
import { CACHE_TAGS } from "@/shared/lib/cache/cached-queries";
import { createClient } from "@/shared/lib/supabase/server";

const schema = z.object({ id: z.string().uuid("ID inválido.") });

export async function deleteTagAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user === null) return { status: "error", message: "Debes iniciar sesión." };

  const parsed = schema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "ID inválido." };

  const session = await getSession();
  if (session === null || !hasModulePermission(session.permissions, "tags", "delete")) {
    return { status: "error", message: "No tienes permiso para eliminar etiquetas." };
  }

  const { count: usageCount, error: countError } = await supabase
    .from("document_tags")
    .select("document_id", { count: "exact", head: true })
    .eq("tag_id", parsed.data.id);

  if (countError !== null) {
    return { status: "error", message: "No se pudo verificar los documentos asociados." };
  }
  if ((usageCount ?? 0) > 0) {
    return {
      status: "error",
      message: `No se puede eliminar: la etiqueta está en ${String(usageCount)} documento(s). Quítala de esos documentos primero.`,
    };
  }

  const { data: deleted, error } = await supabase
    .from("tags")
    .delete()
    .eq("id", parsed.data.id)
    .select("id");
  if (error !== null) return { status: "error", message: "No se pudo eliminar la etiqueta." };
  if (deleted.length === 0) {
    return { status: "error", message: "No se pudo eliminar la etiqueta (sin permiso o no existe)." };
  }

  await recordAudit(supabase, {
    action: "tag.delete",
    entityType: "tag",
    entityId: parsed.data.id,
  });

  revalidatePath("/admin/tags");
  revalidateTag(CACHE_TAGS.tags, "default");
  return { status: "success", message: "Etiqueta eliminada correctamente." };
}
