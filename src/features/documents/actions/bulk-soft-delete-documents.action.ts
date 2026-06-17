"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { DOCUMENTS_STORAGE_BUCKET } from "@/features/documents/lib/documents-config";
import type { ActionResult } from "@/shared/lib/action-result";
import { CACHE_TAGS } from "@/shared/lib/cache/cached-queries";
import { formFieldText } from "@/shared/lib/form-utils";
import { createClient } from "@/shared/lib/supabase/server";

const schema = z.object({
  documentIds: z
    .string()
    .min(1, "Selecciona al menos un documento.")
    .transform((s) =>
      s
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    )
    .pipe(z.array(z.string().uuid()).min(1, "IDs inválidos.")),
});

export async function bulkSoftDeleteDocumentsAction(
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

  const parsed = schema.safeParse({
    documentIds: formFieldText(formData, "documentIds"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const now = new Date().toISOString();
  let deleted = 0;

  for (const documentId of parsed.data.documentIds) {
    const { data: row, error: fetchErr } = await supabase
      .from("documents")
      .select("id, storage_object_path, deleted_at")
      .eq("id", documentId)
      .maybeSingle();

    if (fetchErr !== null || row === null || row.deleted_at != null) continue;

    const storagePath = row.storage_object_path as string;

    const { error: delErr } = await supabase
      .from("documents")
      .update({ deleted_at: now })
      .eq("id", documentId);

    if (delErr !== null) continue;

    await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove([storagePath]);
    deleted += 1;
  }

  if (deleted === 0) {
    return { status: "error", message: "No se pudo eliminar ningún documento." };
  }

  revalidatePath("/documents");
  revalidatePath("/admin/tags");
  revalidatePath("/admin/categories");
  revalidateTag(CACHE_TAGS.tags, "default");

  return {
    status: "success",
    message:
      deleted === 1
        ? "1 documento eliminado correctamente."
        : `${String(deleted)} documentos eliminados correctamente.`,
  };
}
