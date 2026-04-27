import type { SupabaseServer } from "@/features/documents/queries/documents.queries";
import { ROLE_NAMES, type RoleName } from "@/shared/db/user_roles.schema";

function isRoleName(value: unknown): value is RoleName {
  return typeof value === "string" && (ROLE_NAMES as readonly string[]).includes(value);
}

export async function getRoleForUser(
  supabase: SupabaseServer,
  userId: string
): Promise<RoleName | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error !== null || data === null || !isRoleName(data.role)) {
    return null;
  }

  return data.role;
}
