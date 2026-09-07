import { Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { TrashRowActions } from "@/features/documents/components/trash-row-actions";
import { formatFileSize } from "@/features/documents/lib/format-bytes";
import { listTrashedDocuments } from "@/features/documents/queries/documents.queries";
import { LocalDate } from "@/shared/components/local-date";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter } from "@/shared/components/ui/card";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasModulePermission } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZE = 25;
const TH = "text-muted-foreground px-4 py-2.5 text-left text-micro font-semibold tracking-wide uppercase";

export default async function DocumentsTrashPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (session === null) redirect("/login");
  if (!hasModulePermission(session.permissions, "documents", "read")) redirect("/documents");

  const canPurge = hasModulePermission(session.permissions, "documents", "delete");

  const sp = await searchParams;
  const rawPage = Number.parseInt(typeof sp.page === "string" ? sp.page : "", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const supabase = await createClient();
  const { data: rows, count, error } = await listTrashedDocuments(supabase, {
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <PageBreadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Documentos", href: "/documents" },
            { label: "Papelera" },
          ]}
        />
        <h1 className="text-foreground flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Trash2 className="text-primary size-5" aria-hidden />
          Papelera
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Documentos eliminados. Se conservan hasta restaurarlos o eliminarlos permanentemente.
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        {error !== null ? (
          <p className="text-destructive" role="alert">
            No se pudo cargar la papelera: {error.message}
          </p>
        ) : (
          <Card className="gap-0 py-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <Badge variant="outline">{String(count)} en la papelera</Badge>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/documents">← Volver al listado</Link>
              </Button>
            </div>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className={TH}>Título</th>
                      <th className={TH}>Autor</th>
                      <th className={TH}>Tamaño</th>
                      <th className={TH}>Eliminado</th>
                      <th className={TH}>Conservar hasta</th>
                      <th className={`${TH} text-right`}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center">
                          <p className="text-foreground text-sm font-medium">La papelera está vacía</p>
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr key={row.id} className="border-border border-b last:border-b-0">
                          <td className="px-4 py-3 font-medium">{row.title}</td>
                          <td className="text-muted-foreground px-4 py-3">
                            {row.uploader?.email ?? "—"}
                          </td>
                          <td className="text-muted-foreground px-4 py-3">
                            {formatFileSize(row.size_bytes)}
                          </td>
                          <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                            <LocalDate date={row.deleted_at} />
                          </td>
                          <td className="text-muted-foreground px-4 py-3">
                            {row.retention_until ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <TrashRowActions
                              documentId={row.id}
                              title={row.title}
                              canPurge={canPurge}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between gap-3 border-t py-4 text-sm">
              <span className="text-muted-foreground">
                Página {String(page)} de {String(totalPages)}
              </span>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/documents/papelera?page=${String(page - 1)}`}>Anterior</Link>
                  </Button>
                ) : null}
                {page < totalPages ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/documents/papelera?page=${String(page + 1)}`}>Siguiente</Link>
                  </Button>
                ) : null}
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
