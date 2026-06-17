"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";

import {
  QUICK_FILTER_PRESETS,
  type QuickFilterPreset,
} from "@/features/documents/lib/date-utils";
import { buildDocumentsQueryPath } from "@/features/documents/lib/documents-search-params";
import { Button } from "@/shared/components/ui/button";

interface QuickDateFiltersProps {
  currentDateFrom: string;
  currentDateTo: string;
  currentQ: string;
  currentCategory: string;
  currentTag: string;
}

export function QuickDateFilters({
  currentDateFrom,
  currentDateTo,
  currentQ,
  currentCategory,
  currentTag,
}: QuickDateFiltersProps) {
  const router = useRouter();

  function applyQuickFilter(filter: QuickFilterPreset) {
    const { dateFrom, dateTo } = filter.getDates();
    const path = buildDocumentsQueryPath({
      q: currentQ,
      categoryId: currentCategory,
      tagId: currentTag,
      dateFrom,
      dateTo,
      page: 1,
    });
    router.push(path as Route);
  }

  function isActive(filter: QuickFilterPreset): boolean {
    const { dateFrom, dateTo } = filter.getDates();
    return currentDateFrom === dateFrom && currentDateTo === dateTo;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_FILTER_PRESETS.map((f) => (
        <Button
          key={f.key}
          type="button"
          size="sm"
          variant={isActive(f) ? "default" : "outline"}
          className="h-7 text-xs"
          title={
            f.key === "6m"
              ? "Documentos subidos desde hace 6 meses calendario hasta hoy"
              : undefined
          }
          onClick={() => {
            applyQuickFilter(f);
          }}
        >
          {f.label}
        </Button>
      ))}
    </div>
  );
}
