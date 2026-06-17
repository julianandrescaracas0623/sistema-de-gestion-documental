import JSZip from "jszip";
import { type NextRequest, NextResponse } from "next/server";

import { DOCUMENTS_STORAGE_BUCKET } from "@/features/documents/lib/documents-config";
import { listDocumentsForExport } from "@/features/documents/queries/documents.queries";
import { createClient } from "@/shared/lib/supabase/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  const categoryId = sp.get("category") ?? "";
  const tagId = sp.get("tag") ?? "";
  const dateFrom = sp.get("dateFrom") ?? "";
  const dateTo = sp.get("dateTo") ?? "";
  const idsRaw = sp.get("ids") ?? "";

  const documentIds =
    idsRaw !== ""
      ? idsRaw
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : undefined;

  const { data: rows, error } = await listDocumentsForExport(supabase, {
    q,
    categoryId,
    tagId,
    dateFrom,
    dateTo,
    ...(documentIds !== undefined && documentIds.length > 0 ? { documentIds } : {}),
  });

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (rows === null || rows.length === 0) {
    return NextResponse.json({ error: "Sin resultados para exportar" }, { status: 404 });
  }

  const zip = new JSZip();
  const seen = new Map<string, number>();

  await Promise.all(
    rows.map(async (row) => {
      const { data: blob, error: dlErr } = await supabase.storage
        .from(DOCUMENTS_STORAGE_BUCKET)
        .download(row.storage_object_path);

      if (dlErr !== null) return;

      const base = row.file_name;
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      const name = count === 0 ? base : `${String(count)}_${base}`;

      zip.file(name, await blob.arrayBuffer());
    })
  );

  const buffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
  const blob = new Blob([buffer], { type: "application/zip" });

  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/zip; charset=binary",
      "Content-Disposition": `attachment; filename="documentos.zip"`,
    },
  });
}
