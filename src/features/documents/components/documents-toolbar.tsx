"use client";

import { Download, Upload } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { QuickDateFilters } from "@/features/documents/components/QuickDateFilters";
import { DateRangeInputs } from "@/features/documents/components/date-range-inputs";
import { buildDocumentsQueryPath } from "@/features/documents/lib/documents-search-params";
import { FilterChips, FilterPopover } from "@/shared/components/filter-popover";
import { TableSearch } from "@/shared/components/table-search";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";

interface DocumentsToolbarProps {
  q: string;
  categoryId: string;
  tagId: string;
  dateFrom: string;
  dateTo: string;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  total: number;
  exportQuery: string;
}

export function DocumentsToolbar({
  q,
  categoryId,
  tagId,
  dateFrom,
  dateTo,
  categories,
  tags,
  total,
  exportQuery,
}: DocumentsToolbarProps) {
  const router = useRouter();

  const [draftCategory, setDraftCategory] = useState(categoryId);
  const [draftTag, setDraftTag] = useState(tagId);
  const [draftFrom, setDraftFrom] = useState(dateFrom);
  const [draftTo, setDraftTo] = useState(dateTo);

  useEffect(() => {
    setDraftCategory(categoryId);
    setDraftTag(tagId);
    setDraftFrom(dateFrom);
    setDraftTo(dateTo);
  }, [categoryId, tagId, dateFrom, dateTo]);

  const push = (path: string) => {
    router.push(path as Route);
  };

  const navigate = (overrides: Partial<Record<
    "q" | "categoryId" | "tagId" | "dateFrom" | "dateTo",
    string
  >>) => {
    push(
      buildDocumentsQueryPath({
        q: overrides.q ?? q,
        categoryId: overrides.categoryId ?? categoryId,
        tagId: overrides.tagId ?? tagId,
        dateFrom: overrides.dateFrom ?? dateFrom,
        dateTo: overrides.dateTo ?? dateTo,
        page: 1,
      })
    );
  };

  const activeCount =
    (categoryId !== "" ? 1 : 0) +
    (tagId !== "" ? 1 : 0) +
    (dateFrom !== "" || dateTo !== "" ? 1 : 0);

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (categoryId !== "") {
    const name = categories.find((c) => c.id === categoryId)?.name ?? "Categoría";
    chips.push({ key: "cat", label: `Categoría: ${name}`, onRemove: () => { navigate({ categoryId: "" }); } });
  }
  if (tagId !== "") {
    const name = tags.find((t) => t.id === tagId)?.name ?? "Etiqueta";
    chips.push({ key: "tag", label: `Etiqueta: ${name}`, onRemove: () => { navigate({ tagId: "" }); } });
  }
  if (dateFrom !== "" || dateTo !== "") {
    const label =
      dateFrom !== "" && dateTo !== ""
        ? `${dateFrom} – ${dateTo}`
        : dateFrom !== ""
          ? `Desde ${dateFrom}`
          : `Hasta ${dateTo}`;
    chips.push({
      key: "date",
      label,
      onRemove: () => { navigate({ dateFrom: "", dateTo: "" }); },
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="sm:max-w-xs sm:flex-1">
          <TableSearch
            value={q}
            debounceMs={350}
            placeholder="Buscar por título o archivo…"
            onChange={(next) => { navigate({ q: next }); }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterPopover
            activeCount={activeCount}
            onApply={() => {
              navigate({
                categoryId: draftCategory,
                tagId: draftTag,
                dateFrom: draftFrom,
                dateTo: draftTo,
              });
            }}
            onClear={() => { push("/documents"); }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="flt-category">Categoría</Label>
              <Select
                id="flt-category"
                value={draftCategory}
                onChange={(e) => { setDraftCategory(e.target.value); }}
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flt-tag">Etiqueta</Label>
              <Select
                id="flt-tag"
                value={draftTag}
                onChange={(e) => { setDraftTag(e.target.value); }}
              >
                <option value="">Todas</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Período rápido</Label>
              <QuickDateFilters
                currentDateFrom={dateFrom}
                currentDateTo={dateTo}
                currentQ={q}
                currentCategory={categoryId}
                currentTag={tagId}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <DateRangeInputs
                key={`${draftFrom}|${draftTo}`}
                dateFrom={draftFrom}
                dateTo={draftTo}
                onDateFromChange={setDraftFrom}
                onDateToChange={setDraftTo}
              />
            </div>
          </FilterPopover>

          <Badge variant="outline">{String(total)} en total</Badge>

          {total > 0 ? (
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/documents/export?${exportQuery}`}>
                <Download className="size-3.5" />
                Exportar
              </a>
            </Button>
          ) : null}

          <Button size="sm" asChild>
            <Link href="/documents/new">
              <Upload className="size-4" />
              Subir documento
            </Link>
          </Button>
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="px-4 pb-1 sm:px-6">
          <FilterChips chips={chips} />
        </div>
      ) : null}
    </div>
  );
}
