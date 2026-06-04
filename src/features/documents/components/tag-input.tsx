"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";

interface TagInputProps {
  name: string;
  availableTags: { id: string; name: string }[];
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function TagInput({
  name,
  availableTags,
  defaultValue = "",
  disabled = false,
  placeholder = "Escribe y presiona Enter o coma…",
}: TagInputProps) {
  const [selected, setSelected] = useState<string[]>(() =>
    defaultValue
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = availableTags
    .filter(
      (t) =>
        inputValue.length > 0 &&
        t.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selected.map((s) => s.toLowerCase()).includes(t.name.toLowerCase())
    )
    .slice(0, 6);

  const addTag = useCallback((raw: string) => {
    const tag = raw.trim();
    if (tag === "") return;
    setSelected((prev) =>
      prev.map((s) => s.toLowerCase()).includes(tag.toLowerCase()) ? prev : [...prev, tag]
    );
    setInputValue("");
    setOpen(false);
  }, []);

  const removeTag = (tag: string) => {
    setSelected((prev) => prev.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim() !== "") addTag(inputValue);
    } else if (e.key === ",") {
      e.preventDefault();
      if (inputValue.trim() !== "") addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && selected.length > 0) {
      setSelected((prev) => prev.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current !== null && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => { document.removeEventListener("mousedown", handler); };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selected.join(", ")} />

      {/* Tag chips + inline input */}
      <div
        className="border-input bg-background focus-within:ring-ring/50 flex min-h-9 w-full flex-wrap gap-1.5 rounded-md border px-3 py-1.5 text-sm focus-within:ring-[3px] focus-within:outline-none cursor-text"
        onClick={() => { inputRef.current?.focus(); }}
      >
        {selected.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-xs">
            {tag}
            {!disabled ? (
              <button
                type="button"
                className="ml-0.5 rounded-full opacity-60 hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              >
                <X className="size-3" />
              </button>
            ) : null}
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          disabled={disabled}
          placeholder={selected.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (inputValue.length > 0) setOpen(true); }}
        />
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 ? (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {suggestions.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => { e.preventDefault(); addTag(t.name); }}
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-1 text-xs text-muted-foreground">
        Selecciona existente o escribe una nueva y presiona Enter / coma.
      </p>
    </div>
  );
}
