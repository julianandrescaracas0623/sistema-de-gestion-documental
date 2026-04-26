/** Must match `docs/sql/storage-documents-bucket.sql` bucket id. */
export const DOCUMENTS_STORAGE_BUCKET = "documents";

/** Default max upload size (MB). Override with DOCUMENT_UPLOAD_MAX_MB. */
export function getMaxDocumentUploadMb(): number {
  const raw = process.env.DOCUMENT_UPLOAD_MAX_MB;
  if (raw === undefined || raw === "") {
    return 25;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 25;
}
