import type { SupabaseClient } from "@supabase/supabase-js";

type DbClient = Pick<SupabaseClient, "from">;

/** Counts document_tags linked to non-deleted documents, grouped by tag_id. */
export async function aggregateActiveDocCountsByTagId(
  supabase: DbClient,
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("document_tags")
    .select("tag_id, documents!inner(deleted_at)")
    .is("documents.deleted_at", null);

  if (error !== null) {
    return new Map();
  }

  const map = new Map<string, number>();
  for (const row of data) {
    const tagId = row.tag_id as string;
    map.set(tagId, (map.get(tagId) ?? 0) + 1);
  }
  return map;
}

/** Counts non-deleted documents grouped by category_id. */
export async function aggregateActiveDocCountsByCategoryId(
  supabase: DbClient,
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("documents")
    .select("category_id")
    .is("deleted_at", null)
    .not("category_id", "is", null);

  if (error !== null) {
    return new Map();
  }

  const map = new Map<string, number>();
  for (const row of data) {
    const categoryId = row.category_id as string;
    map.set(categoryId, (map.get(categoryId) ?? 0) + 1);
  }
  return map;
}
