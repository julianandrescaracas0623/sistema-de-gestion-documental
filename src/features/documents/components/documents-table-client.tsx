"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { bulkSoftDeleteDocumentsAction } from "@/features/documents/actions/bulk-soft-delete-documents.action";
import {
  DocumentTableRow,
  DocumentsTableHeaderActions,
  DocumentsTableShell,
} from "@/features/documents/components/documents-table-parts";
import type { DocumentSearchParams } from "@/features/documents/lib/documents-search-params";
import {
  buildDocumentsQueryPath,
  buildPageLink,
  PAGE_SIZE_OPTIONS,
} from "@/features/documents/lib/documents-search-params";
import type { DocumentListRow } from "@/features/documents/queries/documents.queries";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { Button } from "@/shared/components/ui/button";
import { CardContent, CardFooter } from "@/shared/components/ui/card";

interface DocumentsTableClientProps {
  rows: DocumentListRow[];
  roleMap: Record<string, string>;
  params: DocumentSearchParams;
  total: number;
  totalPages: number;
  fromItem: number;
  toItem: number;
  exportQuery: string;
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
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const row of rows) next.delete(row.id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const row of rows) next.add(row.id);
        return next;
      });
    }
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

  const handlePageSizeChange = (size: number) => {
    router.push(buildDocumentsQueryPath({ ...params, pageSize: size, page: 1 }) as Route);
  };

  return (
    <DocumentsTableShell>
      <div className="flex flex-wrap items-center justify-end gap-2 border-b px-6 py-3">
        <DocumentsTableHeaderActions total={total} exportQuery={exportQuery} />
      </div>

      {selectedCount > 0 ? (
        <div className="bg-muted/60 flex flex-wrap items-center gap-2 border-b px-6 py-2 text-sm">
          <span>{String(selectedCount)} seleccionado(s)</span>
          {selectedExportUrl !== "" ? (
            <a
              href={selectedExportUrl}
              className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-background"
            >
              Descargar seleccionados
            </a>
          ) : null}
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
        </div>
      ) : null}

      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-muted-foreground w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    aria-label="Seleccionar todos en esta página"
                    onChange={toggleAllPage}
                    className="size-4 rounded border-input"
                  />
                </th>
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
                <th className="text-muted-foreground w-16 px-6 py-2.5 text-right text-[11.5px] font-semibold tracking-wide uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <p className="text-sm font-medium text-foreground">No hay resultados</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ajusta los filtros o sube un documento nuevo.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const roleLabel =
                    row.uploaded_by !== null ? roleMap[row.uploaded_by] : undefined;
                  return (
                    <DocumentTableRow
                      key={row.id}
                      row={row}
                      {...(roleLabel !== undefined ? { role: roleLabel } : {})}
                      showCheckbox
                      selected={selected.has(row.id)}
                      onToggle={toggleOne}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t py-4 text-sm">
        <div className="text-muted-foreground flex flex-wrap items-center gap-3">
          <span>
            Mostrando {String(fromItem)}–{String(toItem)} de {String(total)}
          </span>
          <label className="flex items-center gap-2">
            <span>Por página</span>
            <select
              value={params.pageSize}
              onChange={(e) => {
                handlePageSizeChange(Number.parseInt(e.target.value, 10));
              }}
              className="border-input bg-background h-8 rounded-md border px-2 text-sm"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {String(n)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            Página {String(params.page)} de {String(totalPages)}
          </span>
          {params.page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildPageLink(params, params.page - 1) as Route}>Anterior</Link>
            </Button>
          ) : null}
          {params.page < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildPageLink(params, params.page + 1) as Route}>Siguiente</Link>
            </Button>
          ) : null}
        </div>
      </CardFooter>

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
    </DocumentsTableShell>
  );
}
