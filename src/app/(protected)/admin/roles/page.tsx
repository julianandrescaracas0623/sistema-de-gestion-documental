import { Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RoleTable } from "@/features/role-admin/components/RoleTable";
import { listPermissionsCatalog } from "@/features/role-admin/queries/permissions.queries";
import { listRolesWithDetails } from "@/features/role-admin/queries/roles.queries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getSession } from "@/shared/lib/auth/get-session";
import { canAccessModule } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

export default async function AdminRolesPage() {
  const session = await getSession();
  if (session === null) redirect("/login");
  if (!canAccessModule(session.permissions, "roles")) redirect("/");

  const supabase = await createClient();
  const [{ data: roles, error: rolesError }, { data: permissions, error: permsError }] =
    await Promise.all([listRolesWithDetails(supabase), listPermissionsCatalog(supabase)]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide">
              Inicio <span className="opacity-50">/</span> Administración{" "}
              <span className="opacity-50">/</span> Roles
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Roles y permisos</h1>
            <p className="text-muted-foreground mt-0.5 max-w-xl text-sm">
              Administra quién puede hacer qué en el sistema. Selecciona un rol para configurar sus
              permisos en una vista dedicada.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/admin/roles/new">
              <Plus className="size-4" aria-hidden />
              Nuevo rol
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4 text-primary" />
                Roles del sistema
              </CardTitle>
              <Badge variant="outline">{String(roles?.length ?? 0)} en total</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {rolesError !== null ? (
              <p className="p-6 text-destructive" role="alert">
                No se pudo cargar el listado: {rolesError.message}
              </p>
            ) : permsError !== null ? (
              <p className="p-6 text-destructive" role="alert">
                No se pudo cargar el catálogo de permisos: {permsError.message}
              </p>
            ) : permissions !== null ? (
              <RoleTable rows={roles ?? []} permissions={permissions} />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
