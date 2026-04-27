import { CalendarDays, FileText, Filter, Search, Tag } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { formatFileSize } from "@/features/documents/lib/format-bytes";
import { listCategories } from "@/features/documents/queries/categories.queries";
import { listDocuments, listTagsForFilter } from "@/features/documents/queries/documents.queries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { createClient } from "@/shared/lib/supabase/server";

const PAGE_SIZE = 10;

type SearchParams = Record<string, string | string[] | undefined>;
const DATE_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

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
    <main className="min-h-screen bg-muted/20 px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 px-5 py-4 shadow-sm">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary">Documentos</h1>
            <p className="text-sm text-muted-foreground">Busca, filtra y abre tus archivos autorizados.</p>
          </div>
          <Button asChild>
            <Link href="/documents/new">Subir documento</Link>
          </Button>
        </header>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4 text-primary" />
              Filtros de búsqueda
            </CardTitle>
            <CardDescription>Refina el listado por texto, categoría o etiqueta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="q">Texto</Label>
                <Input id="q" name="q" defaultValue={q} placeholder="Título o nombre del archivo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <select
                  id="category"
                  name="category"
                  defaultValue={categoryId}
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px]"
                >
                  <option value="">Todas</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag">Etiqueta</Label>
                <select
                  id="tag"
                  name="tag"
                  defaultValue={tagId}
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px]"
                >
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
                  <Search className="size-4" />
                  Buscar
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/documents">Limpiar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-primary" />
                Listado de documentos
              </CardTitle>
              <Badge variant="outline">
                {String(total)} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-6 py-3 font-medium">Título</th>
                    <th className="px-6 py-3 font-medium">Categoría</th>
                    <th className="px-6 py-3 font-medium">Tamaño</th>
                    <th className="px-6 py-3 font-medium">Fecha</th>
                    <th className="px-6 py-3 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(rows ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No hay resultados</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Ajusta los filtros o sube un documento nuevo.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    (rows ?? []).map((row) => (
                      <tr key={row.id} className="border-t border-border/70 transition-colors hover:bg-muted/30">
                        <td className="px-6 py-4 font-medium">{row.title}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {row.category?.name != null && row.category.name !== "" ? (
                            <Badge variant="outline" className="max-w-full truncate">
                              <Tag className="size-3" />
                              {row.category.name}
                            </Badge>
                          ) : (
                            "Sin categoría"
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{formatFileSize(row.size_bytes)}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="size-3.5" />
                            {DATE_FORMATTER.format(new Date(row.created_at))}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/documents/${row.id}`}>Ver</Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t py-4 text-sm">
            <span className="text-muted-foreground">
              Página {String(pageNum)} de {String(totalPages)}
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
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
