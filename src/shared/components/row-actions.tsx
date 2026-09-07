"use client";

import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";

export interface RowActionItem {
  /** Accessible label for the icon-only button, e.g. "Editar categoría". */
  label: string;
  icon: LucideIcon;
  /** Click handler (mutually exclusive with `href`). */
  onSelect?: () => void;
  /** Navigation target — renders the button as a link. */
  href?: Route;
  destructive?: boolean;
  disabled?: boolean;
}

/**
 * Inline icon buttons for a table row's "Acciones" column. Replaces the old
 * `TableRowActionsMenu` dropdown: each action is a direct, keyboard-reachable
 * `ghost` icon button with an `aria-label` (there is no visible text).
 */
export function RowActions({ items }: { items: RowActionItem[] }) {
  if (items.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const className = item.destructive === true ? "text-destructive hover:text-destructive" : "";

        if (item.href !== undefined) {
          return (
            <Button
              key={item.label}
              asChild
              variant="ghost"
              size="icon"
              className={`size-8 ${className}`}
            >
              <Link href={item.href} aria-label={item.label} title={item.label}>
                <Icon className="size-4" />
              </Link>
            </Button>
          );
        }

        return (
          <Button
            key={item.label}
            type="button"
            variant="ghost"
            size="icon"
            className={`size-8 ${className}`}
            aria-label={item.label}
            title={item.label}
            disabled={item.disabled === true}
            onClick={item.onSelect}
          >
            <Icon className="size-4" />
          </Button>
        );
      })}
    </div>
  );
}
