"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";

interface QuickFilter {
  label: string;
  key: string;
  getDates: () => { dateFrom: string; dateTo: string };
}

function toDateString(date: Date): string {
  const parts = date.toISOString().split("T");
  return parts[0] ?? "";
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    label: "7 días",
    key: "7d",
    getDates: () => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { dateFrom: toDateString(d), dateTo: toDateString(new Date()) };
    },
  },
  {
    label: "1 mes",
    key: "1m",
    getDates: () => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return { dateFrom: toDateString(d), dateTo: toDateString(new Date()) };
    },
  },
  {
    label: "2 meses",
    key: "2m",
    getDates: () => {
      const d = new Date();
      d.setMonth(d.getMonth() - 2);
      return { dateFrom: toDateString(d), dateTo: toDateString(new Date()) };
    },
  },
  {
    label: "3 meses",
    key: "3m",
    getDates: () => {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      return { dateFrom: toDateString(d), dateTo: toDateString(new Date()) };
    },
  },
  {
    label: "6 meses",
    key: "6m",
    getDates: () => {
      const d = new Date();
      d.setMonth(d.getMonth() - 6);
      return { dateFrom: toDateString(d), dateTo: toDateString(new Date()) };
    },
  },
  {
    label: "1 año",
    key: "1y",
    getDates: () => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      return { dateFrom: toDateString(d), dateTo: toDateString(new Date()) };
    },
  },
];

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

  function applyQuickFilter(filter: QuickFilter) {
    const { dateFrom, dateTo } = filter.getDates();
    const p = new URLSearchParams();
    if (currentQ !== "") p.set("q", currentQ);
    if (currentCategory !== "") p.set("category", currentCategory);
    if (currentTag !== "") p.set("tag", currentTag);
    p.set("dateFrom", dateFrom);
    p.set("dateTo", dateTo);
    router.push(`/documents?${p.toString()}`);
  }

  function isActive(filter: QuickFilter): boolean {
    const { dateFrom, dateTo } = filter.getDates();
    return currentDateFrom === dateFrom && currentDateTo === dateTo;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_FILTERS.map((f) => (
        <Button
          key={f.key}
          type="button"
          size="sm"
          variant={isActive(f) ? "default" : "outline"}
          className="h-7 text-xs"
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
