import type { SupabaseServer } from "@/features/documents/queries/documents.queries";

export interface AuditEvent {
  /** Verb + noun, e.g. "document.upload", "role.update", "user.delete", "login". */
  action: string;
  /** "document" | "user" | "role" | "category" | "tag" | "session" | … */
  entityType: string;
  /** Primary key of the affected row, when there is one. */
  entityId?: string | null;
  /** Human-readable one-liner shown in the activity table. */
  summary?: string | null;
  /** Extra structured context (before/after, counts, filters…). */
  metadata?: Record<string, unknown>;
}

/**
 * Appends one entry to public.audit_log via the `record_audit` RPC (SECURITY
 * DEFINER — stamps the actor from auth.uid()).
 *
 * Best-effort: a failure here must never break the user's action, so all errors
 * are swallowed. Call it AFTER the operation it records has succeeded.
 */
export async function recordAudit(supabase: SupabaseServer, event: AuditEvent): Promise<void> {
  try {
    await supabase.rpc("record_audit", {
      p_action: event.action,
      p_entity_type: event.entityType,
      p_entity_id: event.entityId ?? null,
      p_summary: event.summary ?? null,
      p_metadata: event.metadata ?? {},
    });
  } catch {
    // Auditing is non-critical; never surface a failure to the user.
  }
}
