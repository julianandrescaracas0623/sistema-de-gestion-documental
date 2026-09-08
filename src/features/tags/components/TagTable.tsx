"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { TagForm } from "@/features/tags/components/TagForm";
import { TagRowActions } from "@/features/tags/components/tag-row-actions";
import type { TagAdminRow } from "@/features/tags/queries/tags.queries";
import { DataTableFooter, DataTableToolbar } from "@/shared/components/data-table-shell";
import { LocalDate } from "@/shared/components/local-date";
import { SortableHeader, type SortDirection } from "@/shared/components/sortable-header";
import { TableSearch } from "@/shared/components/table-search";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

type SortKey = "name" | "doc_count" | "created_at";

function compare(a: TagAdminRow, b: TagAdminRow, key: SortKey): number {
  if (key === "doc_count") return a.doc_count - b.doc_count;
  if (key === "created_at") return a.created_at.localeCompare(b.created_at);
  return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
}

export function TagTable({
  rows,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
}: {
  rows: TagAdminRow[];
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDirection }>({ key: "name", dir: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q === "" ? rows : rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => (sort.dir === "asc" ? 1 : -1) * compare(a, b, sort.key));
    return copy;
  }, [filtered, sort]);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const fromItem = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const toItem = Math.min(safePage * pageSize, total);

  const toggle = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" ? "asc" : "desc" }
    );
  };

  const sortBtn = (key: SortKey, label: string) => (
    <button type="button" onClick={() => { toggle(key); }} className="cursor-pointer">
      <SortableHeader label={label} active={sort.key === key} direction={sort.dir} />
    </button>
  );

  return (
    <Card className="gap-0 py-0">
      <DataTableToolbar
        search={
          <TableSearch value={query} onChange={setQuery} placeholder="Buscar etiqueta…" />
        }
      >
        <Badge variant="outline">{String(rows.length)} en total</Badge>
        {canCreate ? (
          <TagForm
            mode="create"
            onSuccess={() => {
              router.refresh();
            }}
            trigger={
              <Button size="sm">
                <Plus className="size-4" />
                Nueva etiqueta
              </Button>
            }
          />
        ) : null}
      </DataTableToolbar>

      {total === 0 ? (
        <div className="p-10 text-center">
          <p className="text-foreground text-sm font-medium">
            {rows.length === 0 ? "No hay etiquetas" : "Sin resultados"}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {rows.length === 0
              ? 'Crea la primera con el botón "Nueva etiqueta".'
              : "Ajusta la búsqueda."}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{sortBtn("name", "Nombre")}</TableHead>
              <TableHead className="text-center">{sortBtn("doc_count", "Documentos")}</TableHead>
              <TableHead>{sortBtn("created_at", "Creada")}</TableHead>
              <TableHead className="w-24 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={row.doc_count > 0 ? "default" : "secondary"}>
                    {String(row.doc_count)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  <LocalDate date={row.created_at} />
                </TableCell>
                <TableCell className="text-right">
                  <TagRowActions tag={row} canUpdate={canUpdate} canDelete={canDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <DataTableFooter
        page={safePage}
        totalPages={totalPages}
        total={total}
        fromItem={fromItem}
        toItem={toItem}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={setPageSize}
        onPageChange={setPage}
      />
    </Card>
  );
}
