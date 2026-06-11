import type { Route } from "next";
import Link from "next/link";

import { cn } from "@/shared/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: Route;
}

export function PageBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="text-muted-foreground text-xs tracking-wide">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = isLast || item.href === undefined;
          const href = item.href;

          return (
            <li key={`${item.label}-${String(index)}`} className="inline-flex items-center gap-1">
              {index > 0 ? <span className="text-muted-foreground/50" aria-hidden>/</span> : null}
              {isCurrent || href === undefined ? (
                <span aria-current="page" className="text-foreground/80 font-medium">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={href}
                  className={cn(
                    "hover:text-foreground focus-visible:text-foreground rounded-sm transition-colors",
                    "focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:outline-none"
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
