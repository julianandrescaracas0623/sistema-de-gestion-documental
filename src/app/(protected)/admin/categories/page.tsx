import { FolderOpen } from "lucide-react";
import { redirect } from "next/navigation";

import { CategoryTable } from "@/features/categories/components/CategoryTable";
import { CreateCategoryForm } from "@/features/categories/components/CreateCategoryForm";
import { listCategoriesWithCount } from "@/features/categories/queries/categories.queries";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getSession } from "@/shared/lib/auth/get-session";
import { canAccessModule } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

export default async function AdminCategoriesPage() {
  const session = await getSession();
  if (session === null) redirect("/login");
  if (!canAccessModule(session.permissions, "categories")) redirect("/");

  const supabase = await createClient();
  const { data: categories, error } = await listCategoriesWithCount(supabase);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card flex shrink-0 flex-col gap-3 border-b px-4 py-4 sm:px-6 lg:px-7 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide">
            Inicio <span className="opacity-50">/</span> Administración <span className="opacity-50">/</span>{" "}
            Categorías
          </p>
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
            <Card className="gap-0 py-0">
              <CardHeader className="border-b py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderOpen className="size-4 text-primary" />
                    Listado de categorías
                  </CardTitle>
                  <Badge variant="outline">{String(categories?.length ?? 0)} en total</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-0">
                <CategoryTable rows={categories ?? []} />
              </CardContent>
            </Card>
            <CreateCategoryForm />
          </div>
        )}
      </div>
    </div>
  );
}
