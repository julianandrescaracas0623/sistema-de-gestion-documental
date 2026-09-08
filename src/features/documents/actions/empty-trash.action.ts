"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { DOCUMENTS_STORAGE_BUCKET } from "@/features/documents/lib/documents-config";
import type { ActionResult } from "@/shared/lib/action-result";
import { recordAudit } from "@/shared/lib/audit/record-audit";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasModulePermission } from "@/shared/lib/auth/permissions";
import { CACHE_TAGS } from "@/shared/lib/cache/cached-queries";
import { createClient } from "@/shared/lib/supabase/server";

const rowSchema = z.object({
  id: z.string().uuid(),
  storage_object_path: z.string().min(1),
});

const STORAGE_BATCH = 100;

/** Vacía la papelera: borrado PERMANENTE de TODOS los documentos eliminados. Requiere `documents.delete`. */
export async function emptyTrashAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return { status: "error", message: "Debes iniciar sesión." };

  const session = await getSession();
  if (session === null || !hasModulePermission(session.permissions, "documents", "delete")) {
    return { status: "error", message: "No tienes permiso para vaciar la papelera." };
  }

  const { data: rows, error: fetchErr } = await supabase
    .from("documents")
    .select("id, storage_object_path")
    .not("deleted_at", "is", null);
  if (fetchErr !== null) {
    return { status: "error", message: "No se pudo cargar la papelera." };
  }

  const parsedRows = rows.flatMap((r) => {
    const p = rowSchema.safeParse(r);
    return p.success ? [p.data] : [];
  });

  if (parsedRows.length === 0) {
    return { status: "error", message: "La papelera ya está vacía." };
  }

  const ids = parsedRows.map((r) => r.id);
  const { data: deleted, error } = await supabase
    .from("documents")
    .delete()
    .in("id", ids)
    .not("deleted_at", "is", null)
    .select("id");

  if (error !== null) {
    return { status: "error", message: "No se pudo vaciar la papelera." };
  }

  const deletedIds = new Set(deleted.map((r) => r.id as string));
  const paths = parsedRows.filter((r) => deletedIds.has(r.id)).map((r) => r.storage_object_path);
  for (let i = 0; i < paths.length; i += STORAGE_BATCH) {
    await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove(paths.slice(i, i + STORAGE_BATCH));
  }

  await recordAudit(supabase, {
    action: "document.purge",
    entityType: "document",
    summary: `Papelera vaciada (${String(deletedIds.size)} documento(s))`,
    metadata: { ids: [...deletedIds] },
  });

  revalidatePath("/documents/papelera");
  revalidateTag(CACHE_TAGS.tags, "default");

  return {
    status: "success",
    message:
      deletedIds.size === 1
        ? "Papelera vaciada: 1 documento eliminado permanentemente."
        : `Papelera vaciada: ${String(deletedIds.size)} documentos eliminados permanentemente.`,
  };
}
