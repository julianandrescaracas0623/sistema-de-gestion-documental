import { CalendarDays, Download, FileText, Filter, Search, Tag } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { QuickDateFilters } from "@/features/documents/components/QuickDateFilters";
import { DocumentDeleteListButton } from "@/features/documents/components/document-delete-list-button";
import { formatFileSize } from "@/features/documents/lib/format-bytes";
import { listCategories } from "@/features/documents/queries/categories.queries";
import { getRolesForUploaders, listDocuments, listTagsForFilter } from "@/features/documents/queries/documents.queries";
import { LocalDate } from "@/shared/components/local-date";
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
  const dateFrom = firstParam(sp.dateFrom);
  const dateTo = firstParam(sp.dateTo);
  const pageRaw = firstParam(sp.page);
  const parsedPage = Number.parseInt(pageRaw === "" ? "1" : pageRaw, 10);
  const pageNum = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const pageIndex = pageNum - 1;

  const [{ data: rows, count, error: listErr }, { data: categories }, { data: tags }] = await Promise.all([
    listDocuments(supabase, { q, categoryId, tagId, dateFrom, dateTo, page: pageIndex, pageSize: PAGE_SIZE }),
    listCategories(supabase),
    listTagsForFilter(supabase),
  ]);

  const uploaderIds = [...new Set((rows ?? []).map((r) => r.uploaded_by))];
  const roleMap = await getRolesForUploaders(uploaderIds);

  if (listErr !== null) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
          <p className="text-muted-foreground text-xs tracking-wide">Documentos</p>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Listado</h1>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
          <p className="text-destructive" role="alert">
            No se pudo cargar el listado: {listErr.message}
          </p>
        </div>
      </div>
    );
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildQuery(nextPage: number): string {
    const p = new URLSearchParams();
    if (q !== "") p.set("q", q);
    if (categoryId !== "") p.set("category", categoryId);
    if (tagId !== "") p.set("tag", tagId);
    if (dateFrom !== "") p.set("dateFrom", dateFrom);
    if (dateTo !== "") p.set("dateTo", dateTo);
    if (nextPage > 1) p.set("page", String(nextPage));
    const s = p.toString();
    return s === "" ? "/documents" : `/documents?${s}`;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card flex shrink-0 flex-col gap-3 border-b px-4 py-4 sm:px-6 lg:px-7 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide">
            Inicio <span className="opacity-50">/</span> Documentos
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Documentos</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Busca, filtra y abre tus archivos autorizados.</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/documents/new">Subir documento</Link>
        </Button>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4 text-primary" />
              Filtros de búsqueda
            </CardTitle>
            <CardDescription>Refina el listado por texto, categoría, etiqueta o fecha.</CardDescription>
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
              {/* Quick date filters — full width */}
              <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                <Label>Período rápido</Label>
                <QuickDateFilters
                  currentDateFrom={dateFrom}
                  currentDateTo={dateTo}
                  currentQ={q}
                  currentCategory={categoryId}
                  currentTag={tagId}
                />
              </div>

              {/* Custom date range */}
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Desde</Label>
                <Input id="dateFrom" name="dateFrom" type="date" defaultValue={dateFrom} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Hasta</Label>
                <Input id="dateTo" name="dateTo" type="date" defaultValue={dateTo} />
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <Button type="submit" className="flex-1 sm:flex-initial">
                  <Search className="size-4" />
                  Buscar
                </Button>
                <Button type="button" variant="outline" asChild className="flex-1 sm:flex-initial">
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
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {String(total)} total
                </Badge>
                {total > 0 ? (
                  <a
                    href={`/api/documents/export?${new URLSearchParams({
                      ...(q !== "" ? { q } : {}),
                      ...(categoryId !== "" ? { category: categoryId } : {}),
                      ...(tagId !== "" ? { tag: tagId } : {}),
                      ...(dateFrom !== "" ? { dateFrom } : {}),
                      ...(dateTo !== "" ? { dateTo } : {}),
                    }).toString()}`}
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                  >
                    <Download className="size-3.5" />
                    Descargar archivos ({String(total)})
                  </a>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-muted-foreground px-6 py-2.5 text-left text-[11.5px] font-semibold tracking-wide uppercase">
                      Título
                    </th>
                    <th className="text-muted-foreground px-6 py-2.5 text-left text-[11.5px] font-semibold tracking-wide uppercase">
                      Categoría
                    </th>
                    <th className="text-muted-foreground px-6 py-2.5 text-left text-[11.5px] font-semibold tracking-wide uppercase">
                      Autor
                    </th>
                    <th className="text-muted-foreground px-6 py-2.5 text-left text-[11.5px] font-semibold tracking-wide uppercase">
                      Tamaño
                    </th>
                    <th className="text-muted-foreground px-6 py-2.5 text-left text-[11.5px] font-semibold tracking-wide uppercase">
                      Fecha
                    </th>
                    <th className="text-muted-foreground px-6 py-2.5 text-right text-[11.5px] font-semibold tracking-wide uppercase">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(rows ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No hay resultados</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Ajusta los filtros o sube un documento nuevo.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    (rows ?? []).map((row) => (
                      <tr
                        key={row.id}
                        className="border-border hover:bg-muted/50 border-b transition-colors last:border-b-0"
                      >
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
                        <td className="px-6 py-4">
                          {(() => {
                            const role = roleMap.get(row.uploaded_by);
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-muted-foreground">{row.uploader?.email ?? "—"}</span>
                                {role != null ? (
                                  <Badge
                                    variant={role === "admin" ? "default" : "secondary"}
                                    className="w-fit text-[10px] px-1.5 py-0"
                                  >
                                    {role === "admin" ? "Admin" : "Usuario"}
                                  </Badge>
                                ) : null}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{formatFileSize(row.size_bytes)}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="size-3.5" />
                            <LocalDate date={row.created_at} />
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/documents/${row.id}`}>Ver</Link>
                            </Button>
                            <DocumentDeleteListButton documentId={row.id} title={row.title} />
                          </div>
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
                  <a href={buildQuery(pageNum - 1)}>Anterior</a>
                </Button>
              ) : null}
              {pageNum < totalPages ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={buildQuery(pageNum + 1)}>Siguiente</a>
                </Button>
              ) : null}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
