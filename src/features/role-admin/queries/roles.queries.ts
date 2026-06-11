import type { SupabaseServer } from "@/features/documents/queries/documents.queries";

export interface RoleAdminRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  permission_keys: string[];
  user_count: number;
}

export async function listRolesWithDetails(
  supabase: SupabaseServer
): Promise<{ data: RoleAdminRow[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("roles")
    .select(
      `
      id,
      slug,
      name,
      description,
      is_system,
      created_at,
      role_permissions (
        permissions:permission_id ( key )
      ),
      user_roles ( user_id )
    `
    )
    .order("name", { ascending: true });

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }

  interface RawRole {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    is_system: boolean;
    created_at: string;
    role_permissions: { permissions: { key: string } | null }[];
    user_roles: { user_id: string }[];
  }

  const rows = (data as unknown as RawRole[]).map((role) => ({
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    is_system: role.is_system,
    created_at: role.created_at,
    permission_keys: role.role_permissions
      .map((rp) => rp.permissions?.key)
      .filter((k): k is string => typeof k === "string"),
    user_count: role.user_roles.length,
  }));

  return { data: rows, error: null };
}

function mapRawRole(role: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  role_permissions: { permissions: { key: string } | null }[];
  user_roles: { user_id: string }[];
}): RoleAdminRow {
  return {
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    is_system: role.is_system,
    created_at: role.created_at,
    permission_keys: role.role_permissions
      .map((rp) => rp.permissions?.key)
      .filter((k): k is string => typeof k === "string"),
    user_count: role.user_roles.length,
  };
}

export async function getRoleById(
  supabase: SupabaseServer,
  id: string
): Promise<{ data: RoleAdminRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("roles")
    .select(
      `
      id,
      slug,
      name,
      description,
      is_system,
      created_at,
      role_permissions (
        permissions:permission_id ( key )
      ),
      user_roles ( user_id )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }

  if (data === null) {
    return { data: null, error: null };
  }

  return { data: mapRawRole(data as unknown as Parameters<typeof mapRawRole>[0]), error: null };
}
