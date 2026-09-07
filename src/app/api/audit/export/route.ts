import { type NextRequest, NextResponse } from "next/server";

import { actionLabel, entityLabel } from "@/features/audit/lib/audit-labels";
import { parseAuditSearchParams } from "@/features/audit/lib/audit-search-params";
import { listAuditLogForExport } from "@/features/audit/queries/audit.queries";
import { recordAudit } from "@/shared/lib/audit/record-audit";
import { getSession } from "@/shared/lib/auth/get-session";
import { canAccessModule } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

function csvCell(value: string | null): string {
  const s = value ?? "";
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const session = await getSession();
  if (session === null || !canAccessModule(session.permissions, "audit")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const params = parseAuditSearchParams(Object.fromEntries(req.nextUrl.searchParams));
  const { data, error } = await listAuditLogForExport(supabase, params);
  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = ["Fecha (UTC)", "Usuario", "Acción", "Entidad", "ID entidad", "Detalle"];
  const lines = [header.map(csvCell).join(",")];
  for (const row of data) {
    lines.push(
      [
        row.created_at,
        row.actor_email,
        actionLabel(row.action),
        entityLabel(row.entity_type),
        row.entity_id,
        row.summary,
      ]
        .map(csvCell)
        .join(",")
    );
  }
  // UTF-8 BOM so Excel opens the CSV with the right encoding.
  const bom = String.fromCharCode(0xfeff);
  const csv = bom + lines.join("\r\n");

  await recordAudit(supabase, {
    action: "audit.export",
    entityType: "audit",
    summary: `${String(data.length)} evento(s) exportados (CSV)`,
    metadata: { count: data.length, filters: params },
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="actividad.csv"`,
    },
  });
}
