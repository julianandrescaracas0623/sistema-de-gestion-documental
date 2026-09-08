import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/shared/lib/utils";

export type SortDirection = "asc" | "desc";

/**
 * Inner content for a sortable column header: label + a direction indicator.
 * Purely presentational — the caller wraps it in a `<button>` (client-sorted
 * tables) or a `<Link>` (URL-sorted paginated tables) and owns the sort state.
 */
export function SortableHeader({
  label,
  active = false,
  direction,
  className,
}: {
  label: React.ReactNode;
  active?: boolean;
  direction?: SortDirection;
  className?: string;
}) {
  const Icon = !active ? ChevronsUpDown : direction === "asc" ? ChevronUp : ChevronDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-micro font-semibold tracking-wide uppercase transition-colors hover:text-foreground",
        active && "text-foreground",
        className
      )}
    >
      {label}
      <Icon className={cn("size-3.5 shrink-0", !active && "opacity-40")} aria-hidden />
    </span>
  );
}
