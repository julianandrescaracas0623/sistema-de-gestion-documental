import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { cn } from "@/shared/lib/utils";

/**
 * Page numbers to render: always the first and last page, plus a ±1 window
 * around the current page, with `"ellipsis"` markers where pages are skipped.
 * `pageItems(5, 20)` → `[1, "ellipsis", 4, 5, 6, "ellipsis", 20]`.
 */
export function pageItems(page: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: (number | "ellipsis")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);

  if (start > 2) items.push("ellipsis");
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < total - 1) items.push("ellipsis");

  items.push(total);
  return items;
}

const itemClass =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border px-2 text-sm transition-colors";
const activeClass = "bg-primary text-primary-foreground border-primary";
const idleClass = "bg-background hover:bg-muted";
const disabledClass = "pointer-events-none opacity-40";

export interface PaginationNavProps {
  page: number;
  totalPages: number;
  className?: string;
  /** Server tables: build a URL for a page. */
  buildHref?: (page: number) => string;
  /** Client tables: navigate to a page. */
  onPageChange?: (page: number) => void;
}

/** Numbered pagination. Server tables pass `buildHref`; client tables pass `onPageChange`. */
export function PaginationNav({
  page,
  totalPages,
  className,
  buildHref,
  onPageChange,
}: PaginationNavProps) {
  if (totalPages <= 1) return null;

  const cell = (
    target: number,
    label: React.ReactNode,
    opts: { active?: boolean; disabled?: boolean; ariaLabel?: string }
  ) => {
    const cls = cn(
      itemClass,
      opts.active === true ? activeClass : idleClass,
      opts.disabled === true && disabledClass
    );
    const current = opts.active === true ? "page" : undefined;

    if (onPageChange !== undefined) {
      return (
        <button
          type="button"
          className={cls}
          aria-label={opts.ariaLabel}
          aria-current={current}
          disabled={opts.disabled === true}
          onClick={() => {
            onPageChange(target);
          }}
        >
          {label}
        </button>
      );
    }
    return (
      <Link
        href={(buildHref?.(target) ?? "#") as Route}
        className={cls}
        aria-label={opts.ariaLabel}
        aria-current={current}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className={cn("flex items-center gap-1", className)} aria-label="Paginación">
      {cell(page - 1, <ChevronLeft className="size-4" />, {
        disabled: page <= 1,
        ariaLabel: "Página anterior",
      })}
      {pageItems(page, totalPages).map((it, i) =>
        it === "ellipsis" ? (
          <span
            key={`e${String(i)}`}
            className="text-muted-foreground inline-flex h-8 min-w-8 items-center justify-center"
          >
            …
          </span>
        ) : (
          <span key={it}>
            {cell(it, String(it), { active: it === page, ariaLabel: `Página ${String(it)}` })}
          </span>
        )
      )}
      {cell(page + 1, <ChevronRight className="size-4" />, {
        disabled: page >= totalPages,
        ariaLabel: "Página siguiente",
      })}
    </nav>
  );
}
