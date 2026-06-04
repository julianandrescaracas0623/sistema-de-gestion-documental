import type { createClient } from "@/shared/lib/supabase/server";

export type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export interface CategoryAdminRow {
  id: string;
  name: string;
  description: string | null;
  doc_count: number;
  created_by_email: string | null;
  created_at: string;
}

export async function listCategoriesWithCount(supabase: SupabaseServer): Promise<{
  data: CategoryAdminRow[] | null;
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("categories")
    .select(
      `
      id,
      name,
      description,
      created_at,
      doc_count:documents(count),
      creator:profiles!created_by(email)
    `
    )
    .order("created_at", { ascending: false });

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }

  interface RawRow {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    doc_count: { count: number | string }[] | null;
    creator: { email?: string } | null;
  }

  const rows = (data as unknown as RawRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    doc_count: Number(row.doc_count?.[0]?.count ?? 0),
    created_by_email: row.creator?.email ?? null,
    created_at: row.created_at,
  }));

  return { data: rows, error: null };
}
