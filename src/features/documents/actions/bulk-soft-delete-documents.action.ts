"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { DOCUMENTS_STORAGE_BUCKET } from "@/features/documents/lib/documents-config";
import type { ActionResult } from "@/shared/lib/action-result";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasModulePermission } from "@/shared/lib/auth/permissions";
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

const rowSchema = z.object({
  id: z.string().uuid(),
  storage_object_path: z.string().min(1),
  deleted_at: z.string().nullable(),
  uploaded_by: z.string().uuid().nullable(),
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

  const session = await getSession();
  if (session === null) {
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

  const { data: rows, error: fetchErr } = await supabase
    .from("documents")
    .select("id, storage_object_path, deleted_at, uploaded_by")
    .in("id", parsed.data.documentIds);

  if (fetchErr !== null) {
    return { status: "error", message: "No se pudo cargar la selección." };
  }

  const canDeleteAny = hasModulePermission(session.permissions, "documents", "delete");
  const deletable = rows
    .flatMap((r) => {
      const p = rowSchema.safeParse(r);
      return p.success ? [p.data] : [];
    })
    .filter((r) => r.deleted_at === null && (canDeleteAny || r.uploaded_by === session.userId));

  if (deletable.length === 0) {
    return { status: "error", message: "No hay documentos que puedas eliminar en la selección." };
  }

  const now = new Date().toISOString();
  const ids = deletable.map((r) => r.id);
  const { data: updated, error: delErr } = await supabase
    .from("documents")
    .update({ deleted_at: now })
    .in("id", ids)
    .is("deleted_at", null)
    .select("id");

  if (delErr !== null) {
    return { status: "error", message: "No se pudieron eliminar los documentos." };
  }

  const deletedIds = new Set(updated.map((r) => r.id as string));
  const deleted = deletedIds.size;
  if (deleted === 0) {
    return { status: "error", message: "No se pudo eliminar ningún documento." };
  }

  const paths = deletable.filter((r) => deletedIds.has(r.id)).map((r) => r.storage_object_path);
  if (paths.length > 0) {
    await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove(paths);
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
