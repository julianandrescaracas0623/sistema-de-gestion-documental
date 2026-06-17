import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DocumentsFilters } from "@/features/documents/components/documents-filters";
import { DocumentsTable } from "@/features/documents/components/documents-table";
import { DocumentsTableSkeleton } from "@/features/documents/components/documents-table-skeleton";
import {
  parseDocumentSearchParams,
  serializeDocumentSearchKey,
} from "@/features/documents/lib/documents-search-params";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import { getSession } from "@/shared/lib/auth/get-session";
import { getCachedCategories, getCachedTagsForFilter } from "@/shared/lib/cache/cached-queries";

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
  const [categories, tags] = await Promise.all([getCachedCategories(), getCachedTagsForFilter()]);
  const suspenseKey = serializeDocumentSearchKey(params);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <PageBreadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Documentos" },
          ]}
        />
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Documentos</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Busca, filtra y abre tus archivos autorizados.
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <DocumentsFilters
          q={params.q}
          categoryId={params.categoryId}
          tagId={params.tagId}
          dateFrom={params.dateFrom}
          dateTo={params.dateTo}
          categories={categories}
          tags={tags}
        />

        <Suspense key={suspenseKey} fallback={<DocumentsTableSkeleton />}>
          <DocumentsTable params={params} />
        </Suspense>
      </div>
    </div>
  );
}
