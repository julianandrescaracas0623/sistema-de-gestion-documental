"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

/**
 * "Filtros" trigger + popover for a data-table toolbar. `activeCount` drives a
 * badge on the trigger. The body (`children`) holds the filter fields; the
 * footer wires "Aplicar" / "Limpiar" through the callbacks.
 */
export function FilterPopover({
  activeCount,
  onApply,
  onClear,
  children,
  align = "end",
}: {
  activeCount: number;
  onApply: () => void;
  onClear: () => void;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="size-3.5" />
          Filtros
          {activeCount > 0 ? (
            <span className="bg-primary text-primary-foreground ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
              {String(activeCount)}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-80 space-y-3">
        <div className="space-y-3">{children}</div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
          >
            Limpiar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onApply();
              setOpen(false);
            }}
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Removable chips showing the filters currently applied, for the toolbar. */
export function FilterChips({
  chips,
  className,
}: {
  chips: { key: string; label: string; onRemove: () => void }[];
  className?: string;
}) {
  if (chips.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="bg-muted text-foreground inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2 text-xs"
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Quitar filtro ${chip.label}`}
            onClick={chip.onRemove}
            className="hover:bg-background/80 rounded-full p-0.5"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
