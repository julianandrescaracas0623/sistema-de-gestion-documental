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
  }
): Promise<{ data: DocumentListRow[] | null; count: number | null; error: Error | null }> {
  const { q, categoryId, tagId, dateFrom, dateTo, page, pageSize } = params;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const safeQ = q !== undefined && q !== "" ? sanitizeDocumentSearchQuery(q) : "";

  let selectBody = listSelect;
  if (tagId !== undefined && tagId !== "") {
    selectBody = `${listSelect}, document_tags!inner(tag_id)`;
  }

  let query = supabase
    .from("documents")
    .select(selectBody, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
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

  if (dateFrom !== undefined && dateFrom !== "") {
    query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  }
  if (dateTo !== undefined && dateTo !== "") {
    query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
  }

  const { data, error, count } = await query;

  if (error !== null) {
    return { data: null, count: null, error: new Error(error.message) };
  }

  return { data: data as unknown as DocumentListRow[], count, error: null };
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
  params: { q?: string; categoryId?: string; tagId?: string; dateFrom?: string; dateTo?: string }
): Promise<{ data: DocumentExportRow[] | null; error: Error | null }> {
  const { q, categoryId, tagId, dateFrom, dateTo } = params;
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
  if (dateFrom !== undefined && dateFrom !== "") {
    query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  }
  if (dateTo !== undefined && dateTo !== "") {
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
