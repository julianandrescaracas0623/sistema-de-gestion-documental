import type { SupabaseServer } from "@/features/documents/queries/documents.queries";

export interface PermissionCatalogRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  module: string;
}

export async function listPermissionsCatalog(
  supabase: SupabaseServer
): Promise<{ data: PermissionCatalogRow[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("permissions")
    .select("id, key, name, description, module")
    .order("module", { ascending: true })
    .order("name", { ascending: true });

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}
