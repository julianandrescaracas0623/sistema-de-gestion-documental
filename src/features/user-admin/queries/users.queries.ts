import { createServiceRoleClient } from "@/shared/lib/supabase/service-role";

export interface UserAdminRow {
  id: string;
  email: string;
  fullName: string;
  roleId: string;
  roleSlug: string;
  roleName: string;
  created_at: string;
}

export interface RoleOption {
  id: string;
  slug: string;
  name: string;
}

export async function listRoles(): Promise<{ data: RoleOption[] | null; error: Error | null }> {
  let adminClient;
  try {
    adminClient = createServiceRoleClient();
  } catch {
    return {
      data: null,
      error: new Error("Falta SUPABASE_SERVICE_ROLE_KEY en la configuración del servidor."),
    };
  }

  const { data, error } = await adminClient
    .from("roles")
    .select("id, slug, name")
    .order("name", { ascending: true });

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

export async function listUsersWithRoles(params: {
  roleSlugFilter?: string;
  page: number;
  pageSize: number;
}): Promise<{ data: UserAdminRow[] | null; count: number | null; error: Error | null }> {
  let adminClient;
  try {
    adminClient = createServiceRoleClient();
  } catch {
    return {
      data: null,
      count: null,
      error: new Error("Falta SUPABASE_SERVICE_ROLE_KEY en la configuración del servidor."),
    };
  }

  const { roleSlugFilter, page, pageSize } = params;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = adminClient
    .from("profiles")
    .select(
      "id, email, full_name, created_at, user_roles!inner(role_id, roles!inner(slug, name))",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (roleSlugFilter !== undefined && roleSlugFilter !== "") {
    query = query.eq("user_roles.roles.slug", roleSlugFilter);
  }

  const { data, error, count } = await query;

  if (error !== null) {
    return { data: null, count: null, error: new Error(error.message) };
  }

  interface RawRow {
    id: string;
    email: string;
    full_name: string;
    created_at: string;
    user_roles: {
      role_id: string;
      roles: { slug: string; name: string };
    }[];
  }

  const rows = (data as unknown as RawRow[]).map((row) => {
    const ur = row.user_roles[0];
    const role = ur?.roles;
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      roleId: ur?.role_id ?? "",
      roleSlug: role?.slug ?? "",
      roleName: role?.name ?? "",
      created_at: row.created_at,
    };
  });

  return { data: rows, count, error: null };
}
