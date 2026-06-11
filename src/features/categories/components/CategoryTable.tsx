"use client";

import { CategoryRowActions } from "@/features/categories/components/category-row-actions";
import type { CategoryAdminRow } from "@/features/categories/queries/categories.queries";
import { LocalDate } from "@/shared/components/local-date";
import { Badge } from "@/shared/components/ui/badge";

export function CategoryTable({ rows }: { rows: CategoryAdminRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm font-medium text-foreground">No hay categorías</p>
        <p className="mt-1 text-sm text-muted-foreground">Crea la primera categoría con el botón superior.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Nombre
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Descripción
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-center text-[11.5px] font-semibold tracking-wide uppercase">
              Documentos
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Creador
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Creada
            </th>
            <th className="text-muted-foreground w-16 px-6 py-2.5 text-right text-[11.5px] font-semibold tracking-wide uppercase">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-border hover:bg-muted/50 border-b transition-colors last:border-b-0"
            >
              <td className="px-6 py-4 font-medium">{row.name}</td>
              <td className="px-6 py-4 text-muted-foreground">
                {row.description ?? <span className="opacity-40">—</span>}
              </td>
              <td className="px-6 py-4 text-center">
                <Badge variant={row.doc_count > 0 ? "default" : "secondary"}>
                  {String(row.doc_count)}
                </Badge>
              </td>
              <td className="px-6 py-4 text-muted-foreground text-xs">
                {row.created_by_email ?? <span className="opacity-40">—</span>}
              </td>
              <td className="px-6 py-4 text-muted-foreground">
                <LocalDate date={row.created_at} />
              </td>
              <td className="px-6 py-4 text-right">
                <CategoryRowActions category={row} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
