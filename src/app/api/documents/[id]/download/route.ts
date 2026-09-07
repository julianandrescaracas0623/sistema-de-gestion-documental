import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSignedDocumentUrl } from "@/features/documents/lib/signed-url";
import { recordAudit } from "@/shared/lib/audit/record-audit";
import { createClient } from "@/shared/lib/supabase/server";

const rowSchema = z.object({
  id: z.string().uuid(),
  file_name: z.string(),
  storage_object_path: z.string().min(1),
  deleted_at: z.string().nullable(),
});

/**
 * Audited single-document download: records the event, then 302-redirects to a
 * short-lived signed storage URL. Row visibility is enforced by RLS on the
 * SELECT below.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Documento inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id, file_name, storage_object_path, deleted_at")
    .eq("id", id)
    .maybeSingle();

  const parsed = rowSchema.safeParse(doc);
  if (!parsed.success || parsed.data.deleted_at !== null) {
    return NextResponse.json({ error: "Documento no disponible" }, { status: 404 });
  }

  const { url, error } = await createSignedDocumentUrl(supabase, parsed.data.storage_object_path, {
    downloadFileName: parsed.data.file_name,
  });
  if (error !== null || url === null) {
    return NextResponse.json({ error: "No se pudo generar la descarga" }, { status: 500 });
  }

  await recordAudit(supabase, {
    action: "document.download",
    entityType: "document",
    entityId: id,
    summary: parsed.data.file_name,
  });

  return NextResponse.redirect(url);
}
