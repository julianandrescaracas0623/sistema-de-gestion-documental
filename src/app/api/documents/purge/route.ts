import { type NextRequest, NextResponse } from "next/server";

import { DOCUMENTS_STORAGE_BUCKET } from "@/features/documents/lib/documents-config";
import { createServiceRoleClient } from "@/shared/lib/supabase/service-role";

/**
 * Purga por retención. Elimina de forma permanente (fila + binario) los
 * documentos activos cuya `retention_until` ya pasó.
 *
 * Pensado para un cron (Vercel Cron, GitHub Actions, etc.). Protegido con el
 * header `Authorization: Bearer <CRON_SECRET>`. Si `CRON_SECRET` no está
 * configurada, el endpoint responde 501.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret === undefined || secret === "") {
    return NextResponse.json({ error: "CRON_SECRET no configurada" }, { status: 501 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 501 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: due, error: listErr } = await admin
    .from("documents")
    .select("id, storage_object_path, title")
    .is("deleted_at", null)
    .not("retention_until", "is", null)
    .lte("retention_until", today)
    .limit(500);

  if (listErr !== null) {
    return NextResponse.json({ error: listErr.message }, { status: 500 });
  }
  const rows = due as { id: string; storage_object_path: string; title: string | null }[];
  if (rows.length === 0) {
    return NextResponse.json({ purged: 0 });
  }

  const ids = rows.map((r) => r.id);
  const paths = rows.map((r) => r.storage_object_path);

  const { error: delErr } = await admin.from("documents").delete().in("id", ids);
  if (delErr !== null) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }
  await admin.storage.from(DOCUMENTS_STORAGE_BUCKET).remove(paths);

  await admin.from("audit_log").insert(
    rows.map((r) => ({
      actor_id: null,
      actor_email: "sistema (purga por retención)",
      action: "document.purge",
      entity_type: "document",
      entity_id: r.id,
      summary: r.title,
      metadata: { reason: "retention" },
    }))
  );

  return NextResponse.json({ purged: rows.length, ids });
}
