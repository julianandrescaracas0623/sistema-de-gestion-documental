"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { DOCUMENTS_STORAGE_BUCKET } from "@/features/documents/lib/documents-config";
import type { ActionResult } from "@/shared/lib/action-result";
import { recordAudit } from "@/shared/lib/audit/record-audit";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasModulePermission } from "@/shared/lib/auth/permissions";
import { CACHE_TAGS } from "@/shared/lib/cache/cached-queries";
import { formFieldText } from "@/shared/lib/form-utils";
import { createClient } from "@/shared/lib/supabase/server";

const schema = z.object({
  documentId: z.string().uuid("Documento inválido."),
});

const documentRowSchema = z.object({
  id: z.string().uuid(),
  storage_object_path: z.string().min(1),
  deleted_at: z.string().nullable(),
  uploaded_by: z.string().uuid().nullable(),
});

export async function softDeleteDocumentAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { status: "error", message: "Debes iniciar sesión." };
  }

  const session = await getSession();
  if (session === null) {
    return { status: "error", message: "Debes iniciar sesión." };
  }

  const parsed = schema.safeParse({
    documentId: formFieldText(formData, "documentId"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { status: "error", message: msg };
  }

  const { documentId } = parsed.data;

  const { data: row, error: fetchErr } = await supabase
    .from("documents")
    .select("id, storage_object_path, deleted_at, uploaded_by")
    .eq("id", documentId)
    .maybeSingle();

  if (fetchErr !== null || row === null) {
    return { status: "error", message: "No se encontró el documento." };
  }

  const rowParsed = documentRowSchema.safeParse(row);
  if (!rowParsed.success) {
    return { status: "error", message: "Datos del documento inválidos." };
  }
  if (rowParsed.data.deleted_at !== null) {
    return { status: "error", message: "El documento ya estaba eliminado." };
  }

  const canDelete =
    hasModulePermission(session.permissions, "documents", "delete") ||
    rowParsed.data.uploaded_by === session.userId;
  if (!canDelete) {
    return { status: "error", message: "No tienes permiso para eliminar este documento." };
  }

  const now = new Date().toISOString();
  const { data: updated, error: delErr } = await supabase
    .from("documents")
    .update({ deleted_at: now })
    .eq("id", documentId)
    .is("deleted_at", null)
    .select("id");

  if (delErr !== null) {
    return { status: "error", message: `No se pudo eliminar: ${delErr.message}` };
  }
  if (updated.length === 0) {
    return {
      status: "error",
      message: "No se pudo eliminar el documento (sin permiso o ya eliminado).",
    };
  }

  const paths: string[] = [rowParsed.data.storage_object_path];
  await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove(paths);

  await recordAudit(supabase, {
    action: "document.delete",
    entityType: "document",
    entityId: documentId,
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/admin/tags");
  revalidatePath("/admin/categories");
  revalidateTag(CACHE_TAGS.tags, "default");
  redirect("/documents");
}
