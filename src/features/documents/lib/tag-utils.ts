/**
 * Normalizes a single tag label for storage (lowercase, trimmed, collapsed spaces).
 */
export function normalizeTagLabel(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, " ");
  return collapsed.toLowerCase().slice(0, 80);
}

/**
 * Parses a comma-separated tag input into unique normalized labels.
 */
export function parseTagInput(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === "") {
    return [];
  }
  const parts = raw.split(",");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const n = normalizeTagLabel(part);
    if (n === "" || seen.has(n)) {
      continue;
    }
    seen.add(n);
    out.push(n);
  }
  return out;
}
