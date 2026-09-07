import { Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DocumentsTable } from "@/features/documents/components/documents-table";
import { DocumentsTableSkeleton } from "@/features/documents/components/documents-table-skeleton";
import {
  parseDocumentSearchParams,
  serializeDocumentSearchKey,
} from "@/features/documents/lib/documents-search-params";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import { Button } from "@/shared/components/ui/button";
import { getSession } from "@/shared/lib/auth/get-session";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (session === null) redirect("/login");

  const sp = await searchParams;
  const params = parseDocumentSearchParams(sp);
  const suspenseKey = serializeDocumentSearchKey(params);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <PageBreadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Documentos" }]} />
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-foreground text-lg font-semibold tracking-tight">Documentos</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Busca, filtra y abre tus archivos autorizados.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/documents/papelera">
              <Trash2 className="size-4" />
              Papelera
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <Suspense key={suspenseKey} fallback={<DocumentsTableSkeleton />}>
          <DocumentsTable params={params} />
        </Suspense>
      </div>
    </div>
  );
}
