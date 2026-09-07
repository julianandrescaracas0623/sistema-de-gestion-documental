"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { bulkSoftDeleteDocumentsAction } from "@/features/documents/actions/bulk-soft-delete-documents.action";
import { DocumentTableRow } from "@/features/documents/components/documents-table-parts";
import { DocumentsToolbar } from "@/features/documents/components/documents-toolbar";
import type { DocumentSearchParams } from "@/features/documents/lib/documents-search-params";
import { buildDocumentsQueryPath, buildPageLink } from "@/features/documents/lib/documents-search-params";
import type { DocumentListRow } from "@/features/documents/queries/documents.queries";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { DataTableFooter } from "@/shared/components/data-table-shell";
import { ServerSortHeader } from "@/shared/components/server-sort-header";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

interface DocumentsTableClientProps {
  rows: DocumentListRow[];
  roleMap: Record<string, string>;
  params: DocumentSearchParams;
  total: number;
  totalPages: number;
  fromItem: number;
  toItem: number;
  exportQuery: string;
  canDelete: boolean;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}

export function DocumentsTableClient({
  rows,
  roleMap,
  params,
  total,
  totalPages,
  fromItem,
  toItem,
  exportQuery,
  canDelete,
  categories,
  tags,
}: DocumentsTableClientProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const selectedCount = selected.size;

  const selectedExportUrl = useMemo(() => {
    if (selectedCount === 0) return "";
    const p = new URLSearchParams(exportQuery);
    p.set("ids", [...selected].join(","));
    return `/api/documents/export?${p.toString()}`;
  }, [exportQuery, selected, selectedCount]);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) for (const row of rows) next.delete(row.id);
      else for (const row of rows) next.add(row.id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("documentIds", [...selected].join(","));
      const result = await bulkSoftDeleteDocumentsAction(null, fd);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setSelected(new Set());
      setDeleteOpen(false);
      router.refresh();
    });
  };

  const buildSortHref = (sort: string, dir: "asc" | "desc") =>
    buildDocumentsQueryPath({
      ...params,
      sort: sort as DocumentSearchParams["sort"],
      dir,
      page: 1,
    });

  return (
    <Card className="gap-0 py-0">
      <DocumentsToolbar
        q={params.q}
        categoryId={params.categoryId}
        tagId={params.tagId}
        dateFrom={params.dateFrom}
        dateTo={params.dateTo}
        categories={categories}
        tags={tags}
        total={total}
        exportQuery={exportQuery}
      />

      {selectedCount > 0 ? (
        <div className="bg-muted/60 flex flex-wrap items-center gap-2 border-b border-border px-4 py-2 text-sm sm:px-6">
          <span>{String(selectedCount)} seleccionado(s)</span>
          {selectedExportUrl !== "" ? (
            <Button variant="outline" size="sm" asChild>
              <a href={selectedExportUrl}>Descargar seleccionados</a>
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => {
                setDeleteOpen(true);
              }}
            >
              Eliminar seleccionados
            </Button>
          ) : null}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-foreground text-sm font-medium">No hay resultados</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Ajusta los filtros o sube un documento nuevo.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={allPageSelected}
                  aria-label="Seleccionar todos en esta página"
                  onCheckedChange={toggleAllPage}
                />
              </TableHead>
              <TableHead>
                <ServerSortHeader
                  columnKey="title"
                  label="Título"
                  activeKey={params.sort}
                  activeDir={params.dir}
                  buildHref={buildSortHref}
                />
              </TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>
                <ServerSortHeader
                  columnKey="size_bytes"
                  label="Tamaño"
                  activeKey={params.sort}
                  activeDir={params.dir}
                  buildHref={buildSortHref}
                />
              </TableHead>
              <TableHead>
                <ServerSortHeader
                  columnKey="created_at"
                  label="Fecha"
                  activeKey={params.sort}
                  activeDir={params.dir}
                  buildHref={buildSortHref}
                />
              </TableHead>
              <TableHead className="w-24 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const roleLabel = row.uploaded_by !== null ? roleMap[row.uploaded_by] : undefined;
              return (
                <DocumentTableRow
                  key={row.id}
                  row={row}
                  {...(roleLabel !== undefined ? { role: roleLabel } : {})}
                  showCheckbox
                  canDelete={canDelete}
                  selected={selected.has(row.id)}
                  onToggle={toggleOne}
                />
              );
            })}
          </TableBody>
        </Table>
      )}

      <DataTableFooter
        page={params.page}
        totalPages={totalPages}
        total={total}
        fromItem={fromItem}
        toItem={toItem}
        pageSize={params.pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          router.push(buildDocumentsQueryPath({ ...params, pageSize: size, page: 1 }) as Route);
        }}
        buildHref={(p) => buildPageLink(params, p)}
      />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar documentos seleccionados"
        description={
          <>
            ¿Eliminar {String(selectedCount)} documento(s) de esta página? Solo se eliminan los
            seleccionados; para más páginas repite el proceso o ajusta el filtro.
          </>
        }
        confirmLabel={isPending ? "Eliminando…" : "Eliminar"}
        isPending={isPending}
        onConfirm={handleBulkDelete}
      />
    </Card>
  );
}
