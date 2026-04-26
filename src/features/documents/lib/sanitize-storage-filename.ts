/**
 * Produces a single-segment safe filename for storage (no path separators).
 */
export function sanitizeStorageFilename(originalName: string): string {
  const base = originalName.replace(/[/\\]/g, "_").replace(/^\.+/, "").trim();
  const limited = base.slice(0, 200);
  return limited === "" ? "document.bin" : limited;
}
