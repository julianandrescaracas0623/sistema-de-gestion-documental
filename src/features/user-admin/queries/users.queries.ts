import { createServiceRoleClient } from "@/shared/lib/supabase/service-role";

export interface UserAdminRow {
  id: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
}

export async function listUsersWithRoles(params: {
  roleFilter?: "admin" | "user";
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

  const { roleFilter, page, pageSize } = params;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = adminClient
    .from("profiles")
    .select("id, email, created_at, user_roles!inner(role)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (roleFilter !== undefined) {
    query = query.eq("user_roles.role", roleFilter);
  }

  const { data, error, count } = await query;

  if (error !== null) {
    return { data: null, count: null, error: new Error(error.message) };
  }

  interface RawRow {
    id: string;
    email: string;
    created_at: string;
    user_roles: { role: string }[];
  }

  const rows = (data as unknown as RawRow[]).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.user_roles[0]?.role === "admin" ? ("admin" as const) : ("user" as const),
    created_at: row.created_at,
  }));

  return { data: rows, count, error: null };
}
