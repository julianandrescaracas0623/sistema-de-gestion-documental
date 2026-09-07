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

interface AuditTableProps {
  rows: AuditLogRow[];
  total: number;
  params: AuditSearchParams;
  exportQuery: string;
}

const TH = "text-muted-foreground px-4 py-2.5 text-left text-micro font-semibold tracking-wide uppercase";

export function AuditTable({ rows, total, params, exportQuery }: AuditTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const fromItem = total === 0 ? 0 : (params.page - 1) * params.pageSize + 1;
  const toItem = Math.min(params.page * params.pageSize, total);

  const pageLink = (page: number): Route =>
    `/admin/actividad${buildAuditQuery({ ...params, page })}` as Route;

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <Badge variant="outline">{String(total)} evento(s)</Badge>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/audit/export${exportQuery}`}>Exportar CSV</a>
        </Button>
      </div>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className={TH}>Fecha</th>
                <th className={TH}>Usuario</th>
                <th className={TH}>Acción</th>
                <th className={TH}>Entidad</th>
                <th className={TH}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center">
                    <p className="text-foreground text-sm font-medium">Sin actividad</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      No hay eventos que coincidan con los filtros.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-border border-b last:border-b-0">
                    <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                      <LocalDate date={row.created_at} />
                    </td>
                    <td className="px-4 py-3">{row.actor_email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={isDestructiveAction(row.action) ? "destructive" : "secondary"}>
                        {actionLabel(row.action)}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {entityLabel(row.entity_type)}
                      {row.entity_id !== null ? (
                        <span className="text-micro ml-1 font-mono opacity-60">
                          {row.entity_id.slice(0, 8)}
                        </span>
                      ) : null}
                    </td>
                    <td className="text-muted-foreground max-w-xs truncate px-4 py-3">
                      {row.summary ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
