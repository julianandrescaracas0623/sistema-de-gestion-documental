import { redirect } from "next/navigation";

import { TagTable } from "@/features/tags/components/TagTable";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import { getSession } from "@/shared/lib/auth/get-session";
import { canAccessModule, hasModulePermission } from "@/shared/lib/auth/permissions";
import { getCachedTagsWithCount } from "@/shared/lib/cache/cached-queries";

export default async function AdminTagsPage() {
  const session = await getSession();
  if (session === null) redirect("/login");
  if (!canAccessModule(session.permissions, "tags")) redirect("/");

  const canCreate = hasModulePermission(session.permissions, "tags", "create");
  const canUpdate = hasModulePermission(session.permissions, "tags", "update");
  const canDelete = hasModulePermission(session.permissions, "tags", "delete");
  const tags = await getCachedTagsWithCount();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <PageBreadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Etiquetas" }]} />
        <h1 className="text-foreground text-lg font-semibold tracking-tight">Etiquetas</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Gestiona las etiquetas disponibles para clasificar documentos.
        </p>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <TagTable rows={tags} canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />
      </div>
    </div>
  );
}
