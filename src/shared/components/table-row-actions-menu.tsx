"use client";

import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

export interface TableRowActionItem {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function TableRowActionsMenu({ items }: { items: TableRowActionItem[] }) {
  if (items.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Abrir menú de acciones"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.label}
              variant={item.destructive === true ? "destructive" : "default"}
              disabled={item.disabled === true}
              onSelect={(event) => {
                event.preventDefault();
                item.onSelect();
              }}
            >
              {Icon !== undefined ? <Icon className="size-4" /> : null}
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
