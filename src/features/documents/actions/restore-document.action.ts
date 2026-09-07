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

const schema = z.object({ documentId: z.string().uuid("Documento inválido.") });

const rowSchema = z.object({
  id: z.string().uuid(),
  deleted_at: z.string().nullable(),
  uploaded_by: z.string().uuid().nullable(),
});

export async function restoreDocumentAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return { status: "error", message: "Debes iniciar sesión." };

  const session = await getSession();
  if (session === null) return { status: "error", message: "Debes iniciar sesión." };

  const parsed = schema.safeParse({ documentId: formFieldText(formData, "documentId") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { data: row } = await supabase
    .from("documents")
    .select("id, deleted_at, uploaded_by")
    .eq("id", parsed.data.documentId)
    .maybeSingle();

  const rowParsed = rowSchema.safeParse(row);
  if (!rowParsed.success) {
    return { status: "error", message: "El documento no existe." };
  }
  if (rowParsed.data.deleted_at === null) {
    return { status: "error", message: "El documento no está en la papelera." };
  }

  const canRestore =
    hasModulePermission(session.permissions, "documents", "update") ||
    rowParsed.data.uploaded_by === session.userId;
  if (!canRestore) {
    return { status: "error", message: "No tienes permiso para restaurar este documento." };
  }

  const { data: updated, error } = await supabase
    .from("documents")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.documentId)
    .not("deleted_at", "is", null)
    .select("id");

  if (error !== null) {
    return { status: "error", message: "No se pudo restaurar el documento." };
  }
  if (updated.length === 0) {
    return { status: "error", message: "No se pudo restaurar el documento (sin permiso)." };
  }

  await recordAudit(supabase, {
    action: "document.restore",
    entityType: "document",
    entityId: parsed.data.documentId,
  });

  revalidatePath("/documents");
  revalidatePath("/documents/papelera");
  revalidateTag(CACHE_TAGS.tags, "default");
  return { status: "success", message: "Documento restaurado." };
}
