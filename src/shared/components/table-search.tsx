"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";

/**
 * Search input for a data-table toolbar. Controlled by `value`; calls `onChange`
 * with the debounced text. The consumer decides what to do (client filter or
 * URL navigation).
 */
export function TableSearch({
  value,
  onChange,
  placeholder = "Buscar…",
  debounceMs = 0,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}) {
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (timer.current !== undefined) clearTimeout(timer.current);
    };
  }, []);

  const emit = (next: string) => {
    setText(next);
    if (debounceMs <= 0) {
      onChange(next);
      return;
    }
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onChange(next);
    }, debounceMs);
  };

  return (
    <div className={cn("relative", className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <input
        type="search"
        value={text}
        onChange={(e) => {
          emit(e.target.value);
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent pr-8 pl-9 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] [&::-webkit-search-cancel-button]:hidden"
      />
      {text !== "" ? (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => {
            emit("");
          }}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
