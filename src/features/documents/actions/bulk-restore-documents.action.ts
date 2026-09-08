"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

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
  deleted_at: z.string().nullable(),
  uploaded_by: z.string().uuid().nullable(),
});

/** Restaura en lote documentos de la papelera. `documents.update` o ser el autor. */
export async function bulkRestoreDocumentsAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return { status: "error", message: "Debes iniciar sesión." };

  const session = await getSession();
  if (session === null) return { status: "error", message: "Debes iniciar sesión." };

  const parsed = schema.safeParse({ documentIds: formFieldText(formData, "documentIds") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { data: rows, error: fetchErr } = await supabase
    .from("documents")
    .select("id, deleted_at, uploaded_by")
    .in("id", parsed.data.documentIds);
  if (fetchErr !== null) {
    return { status: "error", message: "No se pudo cargar la selección." };
  }

  const canUpdateAny = hasModulePermission(session.permissions, "documents", "update");
  const restorable = rows
    .flatMap((r) => {
      const p = rowSchema.safeParse(r);
      return p.success ? [p.data] : [];
    })
    .filter((r) => r.deleted_at !== null && (canUpdateAny || r.uploaded_by === session.userId));

  if (restorable.length === 0) {
    return { status: "error", message: "No hay documentos que puedas restaurar en la selección." };
  }

  const ids = restorable.map((r) => r.id);
  const { data: updated, error: updErr } = await supabase
    .from("documents")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .in("id", ids)
    .not("deleted_at", "is", null)
    .select("id");

  if (updErr !== null) {
    return { status: "error", message: "No se pudieron restaurar los documentos." };
  }

  const restored = updated.length;
  if (restored === 0) {
    return { status: "error", message: "No se pudo restaurar ningún documento." };
  }

  await recordAudit(supabase, {
    action: "document.restore",
    entityType: "document",
    summary: `${String(restored)} documento(s) restaurado(s) en lote`,
    metadata: { ids },
  });

  revalidatePath("/documents");
  revalidatePath("/documents/papelera");
  revalidateTag(CACHE_TAGS.tags, "default");

  return {
    status: "success",
    message:
      restored === 1
        ? "1 documento restaurado correctamente."
        : `${String(restored)} documentos restaurados correctamente.`,
  };
}
