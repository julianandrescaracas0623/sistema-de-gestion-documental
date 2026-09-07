import type { SupabaseServer } from "@/features/documents/queries/documents.queries";

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogFilters {
  actor?: string;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
}

const SELECT = "id, actor_id, actor_email, action, entity_type, entity_id, summary, metadata, created_at";

type Query = ReturnType<ReturnType<SupabaseServer["from"]>["select"]>;

function withFilters(query: Query, f: AuditLogFilters): Query {
  let q = query;
  if (f.actor !== undefined && f.actor !== "") q = q.ilike("actor_email", `%${f.actor}%`);
  if (f.action !== undefined && f.action !== "") q = q.eq("action", f.action);
  if (f.entityType !== undefined && f.entityType !== "") q = q.eq("entity_type", f.entityType);
  if (f.dateFrom !== undefined && f.dateFrom !== "") {
    q = q.gte("created_at", `${f.dateFrom}T00:00:00.000Z`);
  }
  if (f.dateTo !== undefined && f.dateTo !== "") {
    q = q.lte("created_at", `${f.dateTo}T23:59:59.999Z`);
  }
  return q;
}

export async function listAuditLog(
  supabase: SupabaseServer,
  params: AuditLogFilters & { page: number; pageSize: number }
): Promise<{ data: AuditLogRow[]; count: number; error: Error | null }> {
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  const { data, error, count } = await withFilters(
    supabase.from("audit_log").select(SELECT, { count: "exact" }),
    params
  )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error !== null) {
    return { data: [], count: 0, error: new Error(error.message) };
  }
  return { data: data as unknown as AuditLogRow[], count: count ?? 0, error: null };
}

export async function listAuditLogForExport(
  supabase: SupabaseServer,
  filters: AuditLogFilters,
  limit = 5000
): Promise<{ data: AuditLogRow[]; error: Error | null }> {
  const { data, error } = await withFilters(
    supabase.from("audit_log").select(SELECT),
    filters
  )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error !== null) return { data: [], error: new Error(error.message) };
  return { data: data as unknown as AuditLogRow[], error: null };
}

/** Distinct action values present in the log, for the filter dropdown. */
export async function listAuditActions(supabase: SupabaseServer): Promise<string[]> {
  const { data } = await supabase
    .from("audit_log")
    .select("action")
    .order("action", { ascending: true })
    .limit(1000);
  const rows = (data ?? []) as { action: string }[];
  return [...new Set(rows.map((r) => r.action))];
}
