import { redirect } from "next/navigation";

import { RoleEditor } from "@/features/role-admin/components/RoleEditor";
import { listPermissionsCatalog } from "@/features/role-admin/queries/permissions.queries";
import { getRoleById } from "@/features/role-admin/queries/roles.queries";
import { getSession } from "@/shared/lib/auth/get-session";
import { canAccessModule } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session === null) redirect("/login");
  if (!canAccessModule(session.permissions, "roles")) redirect("/");

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: role, error: roleError }, { data: permissions, error: permsError }] =
    await Promise.all([getRoleById(supabase, id), listPermissionsCatalog(supabase)]);

  if (roleError !== null || permsError !== null) {
    return (
      <div className="p-6">
        <p className="text-destructive" role="alert">
          No se pudo cargar el rol: {roleError?.message ?? permsError?.message}
        </p>
      </div>
    );
  }

  if (role === null) {
    redirect("/admin/roles");
  }

  return <RoleEditor mode="edit" role={role} permissions={permissions ?? []} />;
}
