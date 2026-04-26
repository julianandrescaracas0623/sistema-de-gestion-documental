"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { DOCUMENTS_STORAGE_BUCKET } from "@/features/documents/lib/documents-config";
import type { ActionResult } from "@/shared/lib/action-result";
import { formFieldText } from "@/shared/lib/form-utils";
import { createClient } from "@/shared/lib/supabase/server";

const schema = z.object({
  documentId: z.string().uuid("Documento inválido."),
});

const documentRowSchema = z.object({
  id: z.string().uuid(),
  storage_object_path: z.string().min(1),
  deleted_at: z.string().nullable(),
});

export async function softDeleteDocumentAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
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
    .select("id, storage_object_path, deleted_at")
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

  const now = new Date().toISOString();
  const { error: delErr } = await supabase.from("documents").update({ deleted_at: now }).eq("id", documentId);
  if (delErr !== null) {
    return { status: "error", message: `No se pudo eliminar: ${delErr.message}` };
  }

  const paths: string[] = [rowParsed.data.storage_object_path];
  await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove(paths);
  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  redirect("/documents");
}
