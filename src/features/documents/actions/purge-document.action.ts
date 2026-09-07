"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { DOCUMENTS_STORAGE_BUCKET } from "@/features/documents/lib/documents-config";
import type { ActionResult } from "@/shared/lib/action-result";
import { recordAudit } from "@/shared/lib/audit/record-audit";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasModulePermission } from "@/shared/lib/auth/permissions";
import { CACHE_TAGS } from "@/shared/lib/cache/cached-queries";
import { formFieldText } from "@/shared/lib/form-utils";
import { createClient } from "@/shared/lib/supabase/server";

const schema = z.object({ documentId: z.string().uuid("Documento inválido.") });

const rowSchema = z.object({
  id: z.string().uuid(),
  storage_object_path: z.string().min(1),
  deleted_at: z.string().nullable(),
  title: z.string().nullable(),
});

/**
 * Borrado PERMANENTE de un documento que ya está en la papelera: hard-delete de
 * la fila + del binario. Sin vuelta atrás. Requiere `documents.delete`
 * (no basta con ser el autor).
 */
export async function purgeDocumentAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return { status: "error", message: "Debes iniciar sesión." };

  const session = await getSession();
  if (session === null || !hasModulePermission(session.permissions, "documents", "delete")) {
    return { status: "error", message: "No tienes permiso para eliminar documentos de forma permanente." };
  }

  const parsed = schema.safeParse({ documentId: formFieldText(formData, "documentId") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { data: row } = await supabase
    .from("documents")
    .select("id, storage_object_path, deleted_at, title")
    .eq("id", parsed.data.documentId)
    .maybeSingle();

  const rowParsed = rowSchema.safeParse(row);
  if (!rowParsed.success) {
    return { status: "error", message: "El documento no existe." };
  }
  if (rowParsed.data.deleted_at === null) {
    return {
      status: "error",
      message: "Solo se puede eliminar permanentemente un documento que ya está en la papelera.",
    };
  }

  const { data: deleted, error } = await supabase
    .from("documents")
    .delete()
    .eq("id", parsed.data.documentId)
    .select("id");

  if (error !== null) {
    return { status: "error", message: "No se pudo eliminar el documento." };
  }
  if (deleted.length === 0) {
    return { status: "error", message: "No se pudo eliminar el documento (sin permiso)." };
  }

  await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove([rowParsed.data.storage_object_path]);

  await recordAudit(supabase, {
    action: "document.purge",
    entityType: "document",
    entityId: parsed.data.documentId,
    summary: rowParsed.data.title,
  });

  revalidatePath("/documents/papelera");
  revalidateTag(CACHE_TAGS.tags, "default");
  return { status: "success", message: "Documento eliminado permanentemente." };
}
