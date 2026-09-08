"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";

import { AuditToolbar } from "@/features/audit/components/audit-toolbar";
import { actionLabel, entityLabel, isDestructiveAction } from "@/features/audit/lib/audit-labels";
import {
  AUDIT_PAGE_SIZE_OPTIONS,
  buildAuditQuery,
  type AuditSearchParams,
} from "@/features/audit/lib/audit-search-params";
import type { AuditLogRow } from "@/features/audit/queries/audit.queries";
import { DataTableFooter } from "@/shared/components/data-table-shell";
import { LocalDate } from "@/shared/components/local-date";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

interface AuditTableProps {
  rows: AuditLogRow[];
  total: number;
  params: AuditSearchParams;
  actions: string[];
  exportQuery: string;
}

export function AuditTable({ rows, total, params, actions, exportQuery }: AuditTableProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const fromItem = total === 0 ? 0 : (params.page - 1) * params.pageSize + 1;
  const toItem = Math.min(params.page * params.pageSize, total);

  const buildHref = (overrides: Partial<AuditSearchParams>): string =>
    `/admin/actividad${buildAuditQuery({ ...params, ...overrides })}`;

  return (
    <Card className="gap-0 py-0">
      <AuditToolbar params={params} actions={actions} exportQuery={exportQuery} />

      {rows.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-foreground text-sm font-medium">Sin actividad</p>
          <p className="text-muted-foreground mt-1 text-sm">
            No hay eventos que coincidan con los filtros.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  <LocalDate date={row.created_at} />
                </TableCell>
                <TableCell>{row.actor_email ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={isDestructiveAction(row.action) ? "destructive" : "secondary"}>
                    {actionLabel(row.action)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {entityLabel(row.entity_type)}
                  {row.entity_id !== null ? (
                    <span className="text-micro ml-1 font-mono opacity-60">
                      {row.entity_id.slice(0, 8)}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {row.summary ?? "—"}
                </TableCell>
              </TableRow>
            ))}
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
        pageSizeOptions={AUDIT_PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          router.push(buildHref({ pageSize: size, page: 1 }) as Route);
        }}
        buildHref={(p) => buildHref({ page: p })}
      />
    </Card>
  );
}
