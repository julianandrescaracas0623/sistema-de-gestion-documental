import { DOCUMENTS_STORAGE_BUCKET } from "@/features/documents/lib/documents-config";
import type { SupabaseServer } from "@/features/documents/queries/documents.queries";

export async function createSignedDocumentUrl(
  supabase: SupabaseServer,
  storageObjectPath: string,
  options?: { downloadFileName?: string }
): Promise<{ url: string | null; error: Error | null }> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_STORAGE_BUCKET)
    .createSignedUrl(storageObjectPath, 120, {
      ...(options?.downloadFileName !== undefined
        ? { download: options.downloadFileName }
        : {}),
    });

  if (error !== null) {
    return { url: null, error: new Error(error.message) };
  }
  return { url: data.signedUrl, error: null };
}
