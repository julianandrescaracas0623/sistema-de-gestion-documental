import { redirect } from "next/navigation";

import { RoleEditor } from "@/features/role-admin/components/RoleEditor";
import { listPermissionsCatalog } from "@/features/role-admin/queries/permissions.queries";
import { getSession } from "@/shared/lib/auth/get-session";
import { canAccessModule } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

export default async function NewRolePage() {
  const session = await getSession();
  if (session === null) redirect("/login");
  if (!canAccessModule(session.permissions, "roles")) redirect("/");

  const supabase = await createClient();
  const { data: permissions, error } = await listPermissionsCatalog(supabase);

  if (error !== null) {
    return (
      <div className="p-6">
        <p className="text-destructive" role="alert">
          No se pudo cargar el catálogo de permisos: {error.message}
        </p>
      </div>
    );
  }

  return <RoleEditor mode="create" permissions={permissions ?? []} />;
}
