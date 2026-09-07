import { redirect } from "next/navigation";

import { CategoryTable } from "@/features/categories/components/CategoryTable";
import { listCategoriesWithCount } from "@/features/categories/queries/categories.queries";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import { getSession } from "@/shared/lib/auth/get-session";
import { canAccessModule, hasModulePermission } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

export default async function AdminCategoriesPage() {
  const session = await getSession();
  if (session === null) redirect("/login");
  if (!canAccessModule(session.permissions, "categories")) redirect("/");

  const canCreate = hasModulePermission(session.permissions, "categories", "create");
  const canUpdate = hasModulePermission(session.permissions, "categories", "update");
  const canDelete = hasModulePermission(session.permissions, "categories", "delete");

  const supabase = await createClient();
  const { data: categories, error } = await listCategoriesWithCount(supabase);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <PageBreadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Categorías" }]} />
        <h1 className="text-foreground text-lg font-semibold tracking-tight">Categorías</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">Organiza los documentos del sistema.</p>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        {error !== null ? (
          <p className="text-destructive" role="alert">
            No se pudo cargar el listado: {error.message}
          </p>
        ) : (
          <CategoryTable
            rows={categories ?? []}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </div>
    </div>
  );
}
