import { Tag } from "lucide-react";
import { redirect } from "next/navigation";

import { CreateTagForm } from "@/features/tags/components/CreateTagForm";
import { TagTable } from "@/features/tags/components/TagTable";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasPermission } from "@/shared/lib/auth/permissions";
import { getCachedTagsWithCount } from "@/shared/lib/cache/cached-queries";

export default async function AdminTagsPage() {
  const session = await getSession();
  if (session === null) redirect("/login");
  if (!hasPermission(session.permissions, "tags.manage")) redirect("/");

  const tags = await getCachedTagsWithCount();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <p className="text-muted-foreground text-xs tracking-wide">
          Inicio <span className="opacity-50">/</span> Administración <span className="opacity-50">/</span> Etiquetas
        </p>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Etiquetas</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">Gestiona las etiquetas disponibles para clasificar documentos.</p>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <div className="space-y-6">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="size-4 text-primary" />
                  Listado de etiquetas
                </CardTitle>
                <Badge variant="outline">{String(tags.length)} total</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <TagTable rows={tags} />
            </CardContent>
          </Card>
          <CreateTagForm />
        </div>
      </div>
    </div>
  );
}
