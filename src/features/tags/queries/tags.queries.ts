import { aggregateActiveDocCountsByTagId } from "@/features/tags/lib/tag-doc-count";
import { mapTagsWithCounts } from "@/features/tags/lib/tag-list-mapper";
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
  const [{ data: tags, error }, countMap] = await Promise.all([
    supabase.from("tags").select("id, name, created_at").order("name", { ascending: true }),
    aggregateActiveDocCountsByTagId(supabase),
  ]);

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: mapTagsWithCounts(tags, countMap), error: null };
}
