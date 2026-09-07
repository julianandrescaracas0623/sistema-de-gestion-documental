import { Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

import { TrashTableClient } from "@/features/documents/components/trash-table-client";
import {
  TRASH_SORT_KEYS,
  type TrashSortKey,
  listTrashedDocuments,
} from "@/features/documents/queries/documents.queries";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import type { SortDirection } from "@/shared/components/sortable-header";
import { Card } from "@/shared/components/ui/card";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasModulePermission } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZE = 25;

function firstParam(v: string | string[] | undefined): string {
  if (v === undefined) return "";
  return Array.isArray(v) ? (v[0] ?? "") : v;
}

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

  const sortRaw = firstParam(sp.sort);
  const sort: TrashSortKey = (TRASH_SORT_KEYS as readonly string[]).includes(sortRaw)
    ? (sortRaw as TrashSortKey)
    : "deleted_at";
  const dir: SortDirection = firstParam(sp.dir) === "asc" ? "asc" : "desc";

  const supabase = await createClient();
  const { data: rows, count, error } = await listTrashedDocuments(supabase, {
    page,
    pageSize: PAGE_SIZE,
    sort,
    dir,
  });

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  function buildHref(overrides: { page?: number; sort?: string; dir?: string }) {
    const p = new URLSearchParams();
    const nextPage = overrides.page ?? page;
    if (nextPage > 1) p.set("page", String(nextPage));
    const nextSort = overrides.sort ?? (sort === "deleted_at" && dir === "desc" ? "" : sort);
    if (nextSort !== "") {
      p.set("sort", nextSort);
      p.set("dir", overrides.dir ?? dir);
    }
    const s = p.toString();
    return s === "" ? "/documents/papelera" : `/documents/papelera?${s}`;
  }

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
            <TrashTableClient
              rows={rows}
              count={count}
              page={page}
              totalPages={totalPages}
              canPurge={canPurge}
              sort={sort}
              dir={dir}
              buildSortHref={(nextSort, nextDir) => buildHref({ sort: nextSort, dir: nextDir, page: 1 })}
              buildPageHref={(nextPage) => buildHref({ page: nextPage })}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
