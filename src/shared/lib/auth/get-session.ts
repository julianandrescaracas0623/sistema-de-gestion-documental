import { cache } from "react";

import type { RoleName } from "@/shared/db/user_roles.schema";
import { ROLE_NAMES } from "@/shared/db/user_roles.schema";
import { createClient } from "@/shared/lib/supabase/server";

function isRoleName(value: unknown): value is RoleName {
  return typeof value === "string" && (ROLE_NAMES as readonly string[]).includes(value);
}

export interface SessionData {
  userId: string;
  email: string;
  role: RoleName | null;
}

/**
 * Fetches user + role in a single DB round-trip, deduplicated per request via React cache().
 * All Server Components in the same render tree share this result.
 */
export const getSession = cache(async (): Promise<SessionData | null> => {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error !== null || user === null) return null;

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? "",
    role: isRoleName(data?.role) ? data.role : null,
  };
});
