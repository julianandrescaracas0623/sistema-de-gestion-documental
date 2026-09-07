import { FolderOpen } from "lucide-react";
import { redirect } from "next/navigation";

import { CategoryTable } from "@/features/categories/components/CategoryTable";
import { CreateCategoryForm } from "@/features/categories/components/CreateCategoryForm";
import { listCategoriesWithCount } from "@/features/categories/queries/categories.queries";
import { CollapsibleCard } from "@/shared/components/collapsible-card";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import { Badge } from "@/shared/components/ui/badge";
import { CardContent } from "@/shared/components/ui/card";
import { getSession } from "@/shared/lib/auth/get-session";
import { canAccessModule, hasModulePermission } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

export default async function AdminCategoriesPage() {
  const session = await getSession();
  if (session === null) redirect("/login");
  if (!canAccessModule(session.permissions, "categories")) redirect("/");

  const canUpdate = hasModulePermission(session.permissions, "categories", "update");
  const canDelete = hasModulePermission(session.permissions, "categories", "delete");

  const supabase = await createClient();
  const { data: categories, error } = await listCategoriesWithCount(supabase);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card flex shrink-0 flex-col gap-3 border-b px-4 py-4 sm:px-6 lg:px-7 md:flex-row md:items-center md:justify-between">
        <div>
          <PageBreadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Categorías" }]} />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Categorías</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Organiza los documentos del sistema.</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        {error !== null ? (
          <p className="text-destructive" role="alert">
            No se pudo cargar el listado: {error.message}
          </p>
        ) : (
          <div className="space-y-6">
            <CollapsibleCard
              storageId="admin-categories"
              title={
                <>
                  <FolderOpen className="text-primary size-4 shrink-0" aria-hidden />
                  Listado de categorías
                </>
              }
              actions={<Badge variant="outline">{String(categories?.length ?? 0)} en total</Badge>}
            >
              <CardContent className="px-0">
                <CategoryTable
                  rows={categories ?? []}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                />
              </CardContent>
            </CollapsibleCard>
            <CreateCategoryForm />
          </div>
        )}
      </div>
    </div>
  );
}
