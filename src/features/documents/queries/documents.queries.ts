import { normalizeDateRange } from "@/features/documents/lib/date-utils";
import { sanitizeDocumentSearchQuery } from "@/features/documents/lib/search-utils";
import type { createClient } from "@/shared/lib/supabase/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/service-role";

export type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export interface DocumentListRow {
  id: string;
  title: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  uploaded_by: string | null;
  category: { id: string; name: string } | null;
  uploader: { email: string } | null;
  uploader_role?: string | null;
}

export interface DocumentDetailRow extends DocumentListRow {
  description: string | null;
  storage_object_path: string;
  deleted_at: string | null;
  retention_until: string | null;
  document_tags: { tag_id: string; tag: { id: string; name: string } | null }[];
}

const listSelect = `
  id,
  title,
  file_name,
  mime_type,
  size_bytes,
  created_at,
  uploaded_by,
  category:categories (id, name),
  uploader:profiles!uploaded_by (email)
`;

export async function listDocuments(
  supabase: SupabaseServer,
  params: {
    q?: string;
    categoryId?: string;
    tagId?: string;
    dateFrom?: string;
    dateTo?: string;
    page: number;
    pageSize: number;
    sort?: "title" | "size_bytes" | "created_at";
    dir?: "asc" | "desc";
  }
): Promise<{ data: DocumentListRow[] | null; count: number | null; error: Error | null }> {
  const { q, categoryId, tagId, dateFrom: rawFrom, dateTo: rawTo, page, pageSize } = params;
  const { dateFrom, dateTo } = normalizeDateRange(rawFrom ?? "", rawTo ?? "");
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const sortColumn = params.sort ?? "created_at";
  const ascending = (params.dir ?? (params.sort === undefined ? "desc" : "asc")) === "asc";

  const safeQ = q !== undefined && q !== "" ? sanitizeDocumentSearchQuery(q) : "";

  let selectBody = listSelect;
  if (tagId !== undefined && tagId !== "") {
    selectBody = `${listSelect}, document_tags!inner(tag_id)`;
  }

  let query = supabase
    .from("documents")
    .select(selectBody, { count: "exact" })
    .is("deleted_at", null)
    .order(sortColumn, { ascending })
    .range(from, to);

  if (tagId !== undefined && tagId !== "") {
    query = query.eq("document_tags.tag_id", tagId);
  }

  if (categoryId !== undefined && categoryId !== "") {
    query = query.eq("category_id", categoryId);
  }

  if (safeQ !== "") {
    const pattern = `%${safeQ}%`;
    query = query.or(`title.ilike.${pattern},file_name.ilike.${pattern}`);
  }

  if (dateFrom !== "") {
    query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  }
  if (dateTo !== "") {
    query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
  }

  const { data, error, count } = await query;

  if (error !== null) {
    return { data: null, count: null, error: new Error(error.message) };
  }

  return { data: data as unknown as DocumentListRow[], count, error: null };
}

export interface TrashedDocumentRow {
  id: string;
  title: string;
  file_name: string;
  size_bytes: number;
  created_at: string;
  deleted_at: string;
  retention_until: string | null;
  uploader: { email: string } | null;
}

export const TRASH_SORT_KEYS = ["title", "size_bytes", "deleted_at"] as const;
export type TrashSortKey = (typeof TRASH_SORT_KEYS)[number];

export const TRASH_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export async function listTrashedDocuments(
  supabase: SupabaseServer,
  params: { page: number; pageSize: number; sort?: TrashSortKey; dir?: "asc" | "desc" }
): Promise<{ data: TrashedDocumentRow[]; count: number; error: Error | null }> {
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  const sortColumn: TrashSortKey = params.sort ?? "deleted_at";
  const ascending = (params.dir ?? (params.sort === undefined ? "desc" : "asc")) === "asc";

  const { data, error, count } = await supabase
    .from("documents")
    .select(
      "id, title, file_name, size_bytes, created_at, deleted_at, retention_until, uploader:profiles!uploaded_by (email)",
      { count: "exact" }
    )
    .not("deleted_at", "is", null)
    .order(sortColumn, { ascending })
    .range(from, to);

  if (error !== null) {
    return { data: [], count: 0, error: new Error(error.message) };
  }
  return { data: data as unknown as TrashedDocumentRow[], count: count ?? 0, error: null };
}

export async function countTrashedDocuments(
  supabase: SupabaseServer
): Promise<{ count: number; error: Error | null }> {
  const { count, error } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .not("deleted_at", "is", null);
  if (error !== null) return { count: 0, error: new Error(error.message) };
  return { count: count ?? 0, error: null };
}

/** Active documents whose retention date is within `days` (or already past). */
export async function listExpiringDocuments(
  supabase: SupabaseServer,
  days = 30
): Promise<{ data: { id: string; title: string; retention_until: string }[]; error: Error | null }> {
  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, retention_until")
    .is("deleted_at", null)
    .not("retention_until", "is", null)
    .lte("retention_until", limit.toISOString().slice(0, 10))
    .order("retention_until", { ascending: true })
    .limit(50);
  if (error !== null) return { data: [], error: new Error(error.message) };
  return {
    data: data as unknown as { id: string; title: string; retention_until: string }[],
    error: null,
  };
}

export async function listTagsForFilter(supabase: SupabaseServer): Promise<{
  data: { id: string; name: string }[] | null;
  error: Error | null;
}> {
  const { data, error } = await supabase.from("tags").select("id, name").order("name", { ascending: true });
  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function countDocuments(supabase: SupabaseServer): Promise<{ count: number | null; error: Error | null }> {
  const { count, error } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  if (error !== null) {
    return { count: null, error: new Error(error.message) };
  }
  return { count, error: null };
}

export async function listRecentDocuments(
  supabase: SupabaseServer,
  limit = 5
): Promise<{ data: DocumentListRow[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("documents")
    .select(listSelect)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as unknown as DocumentListRow[], error: null };
}

export async function getDocumentById(
  supabase: SupabaseServer,
  id: string
): Promise<{ data: DocumentDetailRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      id,
      title,
      description,
      file_name,
      mime_type,
      size_bytes,
      created_at,
      uploaded_by,
      storage_object_path,
      deleted_at,
      retention_until,
      category:categories (id, name),
      uploader:profiles!uploaded_by (email),
      document_tags (
        tag_id,
        tag:tags (id, name)
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }
  if (data === null) {
    return { data: null, error: null };
  }
  return { data: data as unknown as DocumentDetailRow, error: null };
}

export interface DocumentExportRow {
  id: string;
  file_name: string;
  storage_object_path: string;
}

export async function listDocumentsForExport(
  supabase: SupabaseServer,
  params: {
    q?: string;
    categoryId?: string;
    tagId?: string;
    dateFrom?: string;
    dateTo?: string;
    documentIds?: string[];
  }
): Promise<{ data: DocumentExportRow[] | null; error: Error | null }> {
  const { q, categoryId, tagId, documentIds } = params;
  const { dateFrom, dateTo } = normalizeDateRange(params.dateFrom ?? "", params.dateTo ?? "");
  const safeQ = q !== undefined && q !== "" ? sanitizeDocumentSearchQuery(q) : "";

  let selectBody = "id, file_name, storage_object_path";
  if (tagId !== undefined && tagId !== "") {
    selectBody = `${selectBody}, document_tags!inner(tag_id)`;
  }

  let query = supabase
    .from("documents")
    .select(selectBody)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (documentIds !== undefined && documentIds.length > 0) {
    query = query.in("id", documentIds);
  }

  if (tagId !== undefined && tagId !== "") {
    query = query.eq("document_tags.tag_id", tagId);
  }
  if (categoryId !== undefined && categoryId !== "") {
    query = query.eq("category_id", categoryId);
  }
  if (safeQ !== "") {
    const pattern = `%${safeQ}%`;
    query = query.or(`title.ilike.${pattern},file_name.ilike.${pattern}`);
  }
  if (dateFrom !== "") {
    query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  }
  if (dateTo !== "") {
    query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
  }

  const { data, error } = await query;
  if (error !== null) return { data: null, error: new Error(error.message) };
  return { data: data as unknown as DocumentExportRow[], error: null };
}

export async function getRolesForUploaders(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  let client;
  try {
    client = createServiceRoleClient();
  } catch {
    return new Map();
  }
  const { data } = await client
    .from("user_roles")
    .select("user_id, roles:role_id ( name, slug )")
    .in("user_id", userIds);
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    const rawRoles = row.roles as
      | { name: string; slug: string }
      | { name: string; slug: string }[]
      | null;
    const role = Array.isArray(rawRoles) ? rawRoles[0] : rawRoles;
    const label = role?.name ?? role?.slug;
    if (label !== undefined) {
      map.set(row.user_id as string, label);
    }
  }
  return map;
}
