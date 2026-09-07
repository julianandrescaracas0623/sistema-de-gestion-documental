import type { Route } from "next";
import Link from "next/link";

import { actionLabel, entityLabel, isDestructiveAction } from "@/features/audit/lib/audit-labels";
import {
  buildAuditQuery,
  type AuditSearchParams,
} from "@/features/audit/lib/audit-search-params";
import type { AuditLogRow } from "@/features/audit/queries/audit.queries";
import { LocalDate } from "@/shared/components/local-date";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter } from "@/shared/components/ui/card";
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
  exportQuery: string;
}

export function AuditTable({ rows, total, params, exportQuery }: AuditTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const fromItem = total === 0 ? 0 : (params.page - 1) * params.pageSize + 1;
  const toItem = Math.min(params.page * params.pageSize, total);

  const pageLink = (page: number): Route =>
    `/admin/actividad${buildAuditQuery({ ...params, page })}` as Route;

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-6">
        <Badge variant="outline">{String(total)} evento(s)</Badge>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/audit/export${exportQuery}`}>Exportar CSV</a>
        </Button>
      </div>
      <CardContent className="px-0">
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
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t py-4 text-sm">
        <span className="text-muted-foreground">
          Mostrando {String(fromItem)}–{String(toItem)} de {String(total)}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            Página {String(params.page)} de {String(totalPages)}
          </span>
          {params.page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={pageLink(params.page - 1)}>Anterior</Link>
            </Button>
          ) : null}
          {params.page < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={pageLink(params.page + 1)}>Siguiente</Link>
            </Button>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}
