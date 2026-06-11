import type { SupabaseServer } from "@/features/documents/queries/documents.queries";
import type { PermissionKey } from "@/shared/lib/auth/permissions";

export interface UserAuthContext {
  roleId: string;
  roleSlug: string;
  roleName: string;
  permissions: PermissionKey[];
}

function isPermissionKey(value: string): value is PermissionKey {
  return value.length > 0;
}

export async function getUserAuthContext(
  supabase: SupabaseServer,
  userId: string
): Promise<UserAuthContext | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select(
      `
      role_id,
      roles:role_id (
        slug,
        name,
        role_permissions (
          permissions:permission_id (
            key
          )
        )
      )
    `
    )
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error !== null || data === null) {
    return null;
  }

  const role = data.roles as {
    slug: string;
    name: string;
    role_permissions: { permissions: { key: string } | null }[];
  } | null;

  if (role === null) {
    return null;
  }

  const permissions = role.role_permissions
    .map((rp) => rp.permissions?.key)
    .filter((key): key is string => typeof key === "string" && key.length > 0)
    .filter(isPermissionKey);

  return {
    roleId: data.role_id as string,
    roleSlug: role.slug,
    roleName: role.name,
    permissions,
  };
}
