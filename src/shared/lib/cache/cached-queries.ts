import { unstable_cache } from "next/cache";

import type { CategoryRow } from "@/features/documents/queries/categories.queries";
import {
  aggregateActiveDocCountsByTagId,
} from "@/features/tags/lib/tag-doc-count";
import { mapTagsWithCounts } from "@/features/tags/lib/tag-list-mapper";
import type { TagAdminRow } from "@/features/tags/queries/tags.queries";
import { createServiceRoleClient } from "@/shared/lib/supabase/service-role";

export const CACHE_TAGS = {
  categories: "categories",
  tags: "tags",
} as const;

// Service role client doesn't use cookies() — safe inside unstable_cache.
function getServiceClient() {
  return createServiceRoleClient();
}

export const getCachedCategories = unstable_cache(
  async (): Promise<CategoryRow[]> => {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name, description, color, sort_order")
      .order("sort_order", { ascending: true });
    return (data ?? []);
  },
  ["categories-list"],
  { revalidate: 300, tags: [CACHE_TAGS.categories] }
);

export const getCachedTagsForFilter = unstable_cache(
  async (): Promise<{ id: string; name: string }[]> => {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from("tags")
      .select("id, name")
      .order("name", { ascending: true });
    return (data ?? []);
  },
  ["tags-filter-list"],
  { revalidate: 300, tags: [CACHE_TAGS.tags] }
);

export const getCachedTagsWithCount = unstable_cache(
  async (): Promise<TagAdminRow[]> => {
    const supabase = getServiceClient();
    const [{ data: tags }, countMap] = await Promise.all([
      supabase.from("tags").select("id, name, created_at").order("name", { ascending: true }),
      aggregateActiveDocCountsByTagId(supabase),
    ]);

    if (tags === null) {
      return [];
    }

    return mapTagsWithCounts(tags, countMap);
  },
  ["tags-with-count"],
  { revalidate: 300, tags: [CACHE_TAGS.tags] }
);
