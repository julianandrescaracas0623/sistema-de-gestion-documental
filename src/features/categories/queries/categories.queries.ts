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

  const rows = data.map((row) => {
    const r = row as Record<string, unknown>;
    const docCountArr = r.doc_count as { count: number | string }[] | null | undefined;
    const creatorObj = r.creator as { email?: string } | null;
    return {
      id: r.id as string,
      name: r.name as string,
      description: r.description as string | null,
      doc_count: Number(docCountArr?.[0]?.count ?? 0),
      created_by_email: creatorObj?.email ?? null,
      created_at: r.created_at as string,
    };
  });

  return { data: rows, error: null };
}
