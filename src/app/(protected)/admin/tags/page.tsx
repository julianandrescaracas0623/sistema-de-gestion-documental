import { Tag } from "lucide-react";
import { redirect } from "next/navigation";

import { CreateTagForm } from "@/features/tags/components/CreateTagForm";
import { TagTable } from "@/features/tags/components/TagTable";
import { CollapsibleCard } from "@/shared/components/collapsible-card";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import { Badge } from "@/shared/components/ui/badge";
import { CardContent } from "@/shared/components/ui/card";
import { getSession } from "@/shared/lib/auth/get-session";
import { canAccessModule, hasModulePermission } from "@/shared/lib/auth/permissions";
import { getCachedTagsWithCount } from "@/shared/lib/cache/cached-queries";

export default async function AdminTagsPage() {
  const session = await getSession();
  if (session === null) redirect("/login");
  if (!canAccessModule(session.permissions, "tags")) redirect("/");

  const canUpdate = hasModulePermission(session.permissions, "tags", "update");
  const canDelete = hasModulePermission(session.permissions, "tags", "delete");
  const tags = await getCachedTagsWithCount();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <PageBreadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Etiquetas" }]} />
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Etiquetas</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">Gestiona las etiquetas disponibles para clasificar documentos.</p>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <div className="space-y-6">
          <CollapsibleCard
            storageId="admin-tags"
            title={
              <>
                <Tag className="text-primary size-4 shrink-0" aria-hidden />
                Listado de etiquetas
              </>
            }
            actions={<Badge variant="outline">{String(tags.length)} en total</Badge>}
          >
            <CardContent className="px-0">
              <TagTable rows={tags} canUpdate={canUpdate} canDelete={canDelete} />
            </CardContent>
          </CollapsibleCard>
          <CreateTagForm />
        </div>
      </div>
    </div>
  );
}
