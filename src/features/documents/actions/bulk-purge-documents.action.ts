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
});

/** Borrado PERMANENTE en lote de documentos que ya están en la papelera. Requiere `documents.delete`. */
export async function bulkPurgeDocumentsAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return { status: "error", message: "Debes iniciar sesión." };

  const session = await getSession();
  if (session === null || !hasModulePermission(session.permissions, "documents", "delete")) {
    return {
      status: "error",
      message: "No tienes permiso para eliminar documentos de forma permanente.",
    };
  }

  const parsed = schema.safeParse({ documentIds: formFieldText(formData, "documentIds") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { data: rows, error: fetchErr } = await supabase
    .from("documents")
    .select("id, storage_object_path, deleted_at")
    .in("id", parsed.data.documentIds);
  if (fetchErr !== null) {
    return { status: "error", message: "No se pudo cargar la selección." };
  }

  const purgeable = rows
    .flatMap((r) => {
      const p = rowSchema.safeParse(r);
      return p.success ? [p.data] : [];
    })
    .filter((r) => r.deleted_at !== null);

  if (purgeable.length === 0) {
    return { status: "error", message: "La selección no contiene documentos en la papelera." };
  }

  const ids = purgeable.map((r) => r.id);
  const { data: deleted, error } = await supabase
    .from("documents")
    .delete()
    .in("id", ids)
    .not("deleted_at", "is", null)
    .select("id");

  if (error !== null) {
    return { status: "error", message: "No se pudieron eliminar los documentos." };
  }
  if (deleted.length === 0) {
    return { status: "error", message: "No se pudo eliminar ningún documento." };
  }

  const deletedIds = new Set(deleted.map((r) => r.id as string));
  const paths = purgeable.filter((r) => deletedIds.has(r.id)).map((r) => r.storage_object_path);
  if (paths.length > 0) {
    await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove(paths);
  }

  await recordAudit(supabase, {
    action: "document.purge",
    entityType: "document",
    summary: `${String(deletedIds.size)} documento(s) eliminado(s) en lote`,
    metadata: { ids: [...deletedIds] },
  });

  revalidatePath("/documents/papelera");
  revalidateTag(CACHE_TAGS.tags, "default");

  return {
    status: "success",
    message:
      deletedIds.size === 1
        ? "1 documento eliminado permanentemente."
        : `${String(deletedIds.size)} documentos eliminados permanentemente.`,
  };
}
