import type { createClient } from "@/shared/lib/supabase/server";

export type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sort_order: number;
}

export async function listCategories(supabase: SupabaseServer): Promise<{
  data: CategoryRow[] | null;
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, description, color, sort_order")
    .order("sort_order", { ascending: true });

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data, error: null };
}
