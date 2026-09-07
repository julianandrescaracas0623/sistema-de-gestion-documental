import type { Route } from "next";
import Link from "next/link";

import { SortableHeader, type SortDirection } from "@/shared/components/sortable-header";

/**
 * A column header that sorts a server-paginated table via URL params. The caller
 * supplies the current sort state and a `buildHref` that serializes a new
 * `{ sort, dir }` into the page's query string.
 */
export function ServerSortHeader({
  columnKey,
  label,
  activeKey,
  activeDir,
  buildHref,
}: {
  columnKey: string;
  label: string;
  activeKey: string;
  activeDir: SortDirection;
  buildHref: (sort: string, dir: SortDirection) => string;
}) {
  const active = activeKey === columnKey;
  const nextDir: SortDirection = active && activeDir === "asc" ? "desc" : "asc";

  return (
    <Link href={buildHref(columnKey, nextDir) as Route} className="inline-flex">
      <SortableHeader label={label} active={active} {...(active ? { direction: activeDir } : {})} />
    </Link>
  );
}
