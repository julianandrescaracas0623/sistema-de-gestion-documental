import { aggregateActiveDocCountsByCategoryId } from "@/features/tags/lib/tag-doc-count";
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
  const [{ data, error }, countMap] = await Promise.all([
    supabase
      .from("categories")
      .select(
        `
      id,
      name,
      description,
      created_at,
      creator:profiles!created_by(email)
    `
      )
      .order("created_at", { ascending: false }),
    aggregateActiveDocCountsByCategoryId(supabase),
  ]);

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }

  interface RawRow {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    creator: { email?: string } | null;
  }

  const rows = (data as unknown as RawRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    doc_count: countMap.get(row.id) ?? 0,
    created_by_email: row.creator?.email ?? null,
    created_at: row.created_at,
  }));

  return { data: rows, error: null };
}
