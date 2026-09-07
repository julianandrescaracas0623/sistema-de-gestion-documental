"use client";

import { PaginationNav } from "@/shared/components/pagination-nav";
import { Select } from "@/shared/components/ui/select";
import { cn } from "@/shared/lib/utils";

/**
 * Top bar of a data-table card: a search slot on the left, actions/filters on
 * the right. Wraps on small screens. Sits directly under the card's top edge.
 */
export function DataTableToolbar({
  search,
  children,
  className,
}: {
  search?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className
      )}
    >
      <div className="min-w-0 sm:max-w-xs sm:flex-1">{search}</div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export interface DataTableFooterProps {
  page: number;
  totalPages: number;
  total: number;
  fromItem: number;
  toItem: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (size: number) => void;
  className?: string;
  buildHref?: (page: number) => string;
  onPageChange?: (page: number) => void;
}

/** Bottom bar: "Mostrando X–Y de Z" + rows-per-page select + numbered pagination. */
export function DataTableFooter({
  page,
  totalPages,
  total,
  fromItem,
  toItem,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  className,
  buildHref,
  onPageChange,
}: DataTableFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className
      )}
    >
      <div className="text-muted-foreground flex flex-wrap items-center gap-3">
        <span>
          {total === 0
            ? "Sin resultados"
            : `Mostrando ${String(fromItem)}–${String(toItem)} de ${String(total)}`}
        </span>
        <label className="flex items-center gap-2">
          <span>Por página</span>
          <Select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number.parseInt(e.target.value, 10));
            }}
            className="h-8 w-auto"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {String(n)}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <PaginationNav
        page={page}
        totalPages={totalPages}
        {...(buildHref !== undefined ? { buildHref } : {})}
        {...(onPageChange !== undefined ? { onPageChange } : {})}
      />
    </div>
  );
}
