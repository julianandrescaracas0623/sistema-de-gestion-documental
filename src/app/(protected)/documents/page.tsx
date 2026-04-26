import Link from "next/link";
import { redirect } from "next/navigation";

import { formatFileSize } from "@/features/documents/lib/format-bytes";
import { listCategories } from "@/features/documents/queries/categories.queries";
import { listDocuments, listTagsForFilter } from "@/features/documents/queries/documents.queries";
import { Button } from "@/shared/components/ui/button";
import { createClient } from "@/shared/lib/supabase/server";

const PAGE_SIZE = 10;

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(v: string | string[] | undefined): string {
  if (v === undefined) {
    return "";
  }
  return Array.isArray(v) ? (v[0] ?? "") : v;
}

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    redirect("/login");
  }

  const sp = await searchParams;
  const q = firstParam(sp.q);
  const categoryId = firstParam(sp.category);
  const tagId = firstParam(sp.tag);
  const pageRaw = firstParam(sp.page);
  const parsedPage = Number.parseInt(pageRaw === "" ? "1" : pageRaw, 10);
  const pageNum = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const pageIndex = pageNum - 1;

  const [{ data: rows, count, error: listErr }, { data: categories }, { data: tags }] = await Promise.all([
    listDocuments(supabase, { q, categoryId, tagId, page: pageIndex, pageSize: PAGE_SIZE }),
    listCategories(supabase),
    listTagsForFilter(supabase),
  ]);

  if (listErr !== null) {
    return (
      <main className="container mx-auto max-w-5xl p-8">
        <p className="text-destructive" role="alert">
          No se pudo cargar el listado: {listErr.message}
        </p>
      </main>
    );
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildQuery(nextPage: number): string {
    const p = new URLSearchParams();
    if (q !== "") {
      p.set("q", q);
    }
    if (categoryId !== "") {
      p.set("category", categoryId);
    }
    if (tagId !== "") {
      p.set("tag", tagId);
    }
    if (nextPage > 1) {
      p.set("page", String(nextPage));
    }
    const s = p.toString();
    return s === "" ? "/documents" : `/documents?${s}`;
  }

  return (
    <main className="container mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="text-muted-foreground mt-1 text-sm">Busca, filtra y abre tus archivos autorizados.</p>
        </div>
        <Button asChild>
          <Link href="/documents/new">Subir documento</Link>
        </Button>
      </div>

      <form method="get" className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label htmlFor="q" className="text-sm font-medium">
            Texto
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Título o nombre de archivo"
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="category" className="text-sm font-medium">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            defaultValue={categoryId}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">Todas</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="tag" className="text-sm font-medium">
            Etiqueta
          </label>
          <select id="tag" name="tag" defaultValue={tagId} className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm">
            <option value="">Todas</option>
            {(tags ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" className="w-full sm:w-auto">
            Buscar
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/documents">Limpiar</Link>
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 font-medium">Título</th>
              <th className="p-3 font-medium">Categoría</th>
              <th className="p-3 font-medium">Tamaño</th>
              <th className="p-3 font-medium">Fecha</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground p-6 text-center">
                  No hay resultados. Ajusta filtros o sube un documento nuevo.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="p-3 font-medium">{row.title}</td>
                  <td className="text-muted-foreground p-3">{row.category?.name ?? "—"}</td>
                  <td className="text-muted-foreground p-3">{formatFileSize(row.size_bytes)}</td>
                  <td className="text-muted-foreground p-3">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <Link href={`/documents/${row.id}`} className="text-primary text-sm font-medium underline-offset-4 hover:underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          Página {String(pageNum)} de {String(totalPages)} · {String(total)} documentos
        </span>
        <div className="flex gap-2">
          {pageNum > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildQuery(pageNum - 1)}>Anterior</Link>
            </Button>
          ) : null}
          {pageNum < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildQuery(pageNum + 1)}>Siguiente</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
