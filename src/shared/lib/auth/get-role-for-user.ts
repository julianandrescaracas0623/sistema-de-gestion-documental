import { getUserAuthContext } from "./get-user-auth-context";

import type { SupabaseServer } from "@/features/documents/queries/documents.queries";

/** @deprecated Prefer getUserAuthContext or getSession permissions */
export async function getRoleForUser(
  supabase: SupabaseServer,
  userId: string
): Promise<"admin" | "user" | null> {
  const ctx = await getUserAuthContext(supabase, userId);
  if (ctx === null) return null;
  if (ctx.roleSlug === "admin") return "admin";
  if (ctx.roleSlug === "user") return "user";
  return null;
}
