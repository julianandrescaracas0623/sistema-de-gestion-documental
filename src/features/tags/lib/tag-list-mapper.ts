import type { TagAdminRow } from "@/features/tags/queries/tags.queries";

export interface TagListRow {
  id: string;
  name: string;
  created_at: string;
}

export function mapTagsWithCounts(
  tags: TagListRow[],
  countMap: Map<string, number>,
): TagAdminRow[] {
  return tags.map((row) => ({
    id: row.id,
    name: row.name,
    doc_count: countMap.get(row.id) ?? 0,
    created_at: row.created_at,
  }));
}
