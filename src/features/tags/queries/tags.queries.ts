import type { createClient } from "@/shared/lib/supabase/server";

export type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export interface TagAdminRow {
  id: string;
  name: string;
  doc_count: number;
  created_at: string;
}

export async function listTagsWithCount(supabase: SupabaseServer): Promise<{
  data: TagAdminRow[] | null;
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, created_at, doc_count:document_tags(count)")
    .order("name", { ascending: true });

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }

  interface RawRow {
    id: string;
    name: string;
    created_at: string;
    doc_count: { count: number | string }[] | null;
  }

  const rows = (data as unknown as RawRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    doc_count: Number(row.doc_count?.[0]?.count ?? 0),
    created_at: row.created_at,
  }));

  return { data: rows, error: null };
}
