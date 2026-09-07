"use client";

import { useMemo, useState } from "react";

import { TagRowActions } from "@/features/tags/components/tag-row-actions";
import type { TagAdminRow } from "@/features/tags/queries/tags.queries";
import { LocalDate } from "@/shared/components/local-date";
import { SortableHeader, type SortDirection } from "@/shared/components/sortable-header";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

type SortKey = "name" | "doc_count" | "created_at";

function compare(a: TagAdminRow, b: TagAdminRow, key: SortKey): number {
  if (key === "doc_count") return a.doc_count - b.doc_count;
  if (key === "created_at") return a.created_at.localeCompare(b.created_at);
  return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
}

export function TagTable({
  rows,
  canUpdate = true,
  canDelete = true,
}: {
  rows: TagAdminRow[];
  canUpdate?: boolean;
  canDelete?: boolean;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDirection }>({
    key: "name",
    dir: "asc",
  });

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const base = compare(a, b, sort.key);
      return sort.dir === "asc" ? base : -base;
    });
    return copy;
  }, [rows, sort]);

  const toggle = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" ? "asc" : "desc" }
    );
  };

  const sortButton = (key: SortKey, label: string) => (
    <button type="button" onClick={() => { toggle(key); }} className="cursor-pointer">
      <SortableHeader label={label} active={sort.key === key} direction={sort.dir} />
    </button>
  );

  if (rows.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-foreground text-sm font-medium">No hay etiquetas</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Crea la primera etiqueta con el formulario inferior.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>{sortButton("name", "Nombre")}</TableHead>
          <TableHead className="text-center">{sortButton("doc_count", "Documentos")}</TableHead>
          <TableHead>{sortButton("created_at", "Creada")}</TableHead>
          <TableHead className="w-24 text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
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
  );
}
