"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { bulkPurgeDocumentsAction } from "@/features/documents/actions/bulk-purge-documents.action";
import { bulkRestoreDocumentsAction } from "@/features/documents/actions/bulk-restore-documents.action";
import { emptyTrashAction } from "@/features/documents/actions/empty-trash.action";
import { TrashRowActions } from "@/features/documents/components/trash-row-actions";
import { formatFileSize } from "@/features/documents/lib/format-bytes";
import {
  TRASH_PAGE_SIZE_OPTIONS,
  type TrashedDocumentRow,
} from "@/features/documents/queries/documents.queries";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { DataTableFooter } from "@/shared/components/data-table-shell";
import { LocalDate } from "@/shared/components/local-date";
import { ServerSortHeader } from "@/shared/components/server-sort-header";
import type { SortDirection } from "@/shared/components/sortable-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { CardContent } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const DEFAULT_SORT = "deleted_at";

function buildHref(opts: {
  page: number;
  pageSize: number;
  sort: string;
  dir: SortDirection;
}): string {
  const p = new URLSearchParams();
  if (opts.page > 1) p.set("page", String(opts.page));
  if (opts.pageSize !== TRASH_PAGE_SIZE_OPTIONS[0]) p.set("pageSize", String(opts.pageSize));
  if (!(opts.sort === DEFAULT_SORT && opts.dir === "desc")) {
    p.set("sort", opts.sort);
    p.set("dir", opts.dir);
  }
  const s = p.toString();
  return s === "" ? "/documents/papelera" : `/documents/papelera?${s}`;
}

export function TrashTableClient({
  rows,
  count,
  page,
  pageSize,
  totalPages,
  fromItem,
  toItem,
  canPurge,
  sort,
  dir,
}: {
  rows: TrashedDocumentRow[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  fromItem: number;
  toItem: number;
  canPurge: boolean;
  sort: string;
  dir: SortDirection;
}) {
  const router = useRouter();
  const buildSortHref = (nextSort: string, nextDir: SortDirection) =>
    buildHref({ page: 1, pageSize, sort: nextSort, dir: nextDir });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [emptyOpen, setEmptyOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0;

  const idList = useMemo(() => [...selected].join(","), [selected]);

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
      if (allPageSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const runBulk = (action: typeof bulkRestoreDocumentsAction) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("documentIds", idList);
      const result = await action(null, fd);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setSelected(new Set());
      setPurgeOpen(false);
      router.refresh();
    });
  };

  const emptyTrash = () => {
    startTransition(async () => {
      const result = await emptyTrashAction();
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setSelected(new Set());
      setEmptyOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-6">
        <Badge variant="outline">{String(count)} en la papelera</Badge>
        <div className="flex flex-wrap items-center gap-2">
          {canPurge && count > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={() => {
                setEmptyOpen(true);
              }}
            >
              <Trash2 className="size-3.5" />
              Vaciar papelera
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/documents">← Volver al listado</Link>
          </Button>
        </div>
      </div>

      {someSelected ? (
        <div className="bg-muted/60 flex flex-wrap items-center gap-2 border-b px-4 py-2 text-sm sm:px-6">
          <span>{String(selected.size)} seleccionado(s)</span>
          <Button type="button" variant="ghost" size="sm" onClick={toggleAllPage}>
            {allPageSelected ? "Quitar selección" : `Seleccionar todo (${String(rows.length)})`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => {
              runBulk(bulkRestoreDocumentsAction);
            }}
          >
            <RotateCcw className="size-3.5" />
            Restaurar seleccionados
          </Button>
          {canPurge ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setPurgeOpen(true);
              }}
            >
              Eliminar seleccionados
            </Button>
          ) : null}
        </div>
      ) : null}

      <CardContent className="px-0">
        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-foreground text-sm font-medium">La papelera está vacía</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10" aria-label="Selección" />
                <TableHead>
                  <ServerSortHeader
                    columnKey="title"
                    label="Título"
                    activeKey={sort}
                    activeDir={dir}
                    buildHref={buildSortHref}
                  />
                </TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>
                  <ServerSortHeader
                    columnKey="size_bytes"
                    label="Tamaño"
                    activeKey={sort}
                    activeDir={dir}
                    buildHref={buildSortHref}
                  />
                </TableHead>
                <TableHead>
                  <ServerSortHeader
                    columnKey="deleted_at"
                    label="Eliminado"
                    activeKey={sort}
                    activeDir={dir}
                    buildHref={buildSortHref}
                  />
                </TableHead>
                <TableHead>Conservar hasta</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} data-state={selected.has(row.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={() => {
                        toggleOne(row.id);
                      }}
                      aria-label={`Seleccionar ${row.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.uploader?.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatFileSize(row.size_bytes)}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    <LocalDate date={row.deleted_at} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.retention_until ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <TrashRowActions documentId={row.id} title={row.title} canPurge={canPurge} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <DataTableFooter
        page={page}
        totalPages={totalPages}
        total={count}
        fromItem={fromItem}
        toItem={toItem}
        pageSize={pageSize}
        pageSizeOptions={TRASH_PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          router.push(buildHref({ page: 1, pageSize: size, sort, dir }) as Route);
        }}
        buildHref={(p) => buildHref({ page: p, pageSize, sort, dir })}
      />

      <ConfirmDestructiveDialog
        open={purgeOpen}
        onOpenChange={setPurgeOpen}
        title="Eliminar seleccionados permanentemente"
        description={
          <>
            ¿Eliminar {String(selected.size)} documento(s) de forma permanente? Se borra el registro
            y el archivo. Esta acción no se puede deshacer.
          </>
        }
        confirmLabel={isPending ? "Eliminando…" : "Eliminar permanentemente"}
        isPending={isPending}
        onConfirm={() => {
          runBulk(bulkPurgeDocumentsAction);
        }}
      />

      <ConfirmDestructiveDialog
        open={emptyOpen}
        onOpenChange={setEmptyOpen}
        title="Vaciar la papelera"
        description={
          <>
            ¿Eliminar de forma permanente <strong>todos</strong> los documentos de la papelera
            ({String(count)})? Se borran los registros y los archivos. Esta acción no se puede
            deshacer.
          </>
        }
        confirmLabel={isPending ? "Vaciando…" : "Vaciar papelera"}
        isPending={isPending}
        onConfirm={emptyTrash}
      />
    </>
  );
}
