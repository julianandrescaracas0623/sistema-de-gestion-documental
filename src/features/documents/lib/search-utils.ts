/**
 * Removes wildcard characters from user search input to avoid ILIKE injection.
 */
export function sanitizeDocumentSearchQuery(raw: string): string {
  return raw.trim().replace(/[%_\\,]/g, "").slice(0, 200);
}
