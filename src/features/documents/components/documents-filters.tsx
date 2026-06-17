"use client";

import { Filter, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { QuickDateFilters } from "@/features/documents/components/QuickDateFilters";
import { ActiveDateFilterHint } from "@/features/documents/components/active-date-filter-hint";
import { DateRangeInputs } from "@/features/documents/components/date-range-inputs";
import { buildDocumentsQueryPath } from "@/features/documents/lib/documents-search-params";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface DocumentsFiltersProps {
  q: string;
  categoryId: string;
  tagId: string;
  dateFrom: string;
  dateTo: string;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}

export function DocumentsFilters({
  q: initialQ,
  categoryId: initialCategoryId,
  tagId: initialTagId,
  dateFrom: initialDateFrom,
  dateTo: initialDateTo,
  categories,
  tags,
}: DocumentsFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [tagId, setTagId] = useState(initialTagId);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);

  useEffect(() => {
    setQ(initialQ);
    setCategoryId(initialCategoryId);
    setTagId(initialTagId);
    setDateFrom(initialDateFrom);
    setDateTo(initialDateTo);
  }, [initialQ, initialCategoryId, initialTagId, initialDateFrom, initialDateTo]);

  const navigate = useCallback(
    (overrides: Partial<{
      q: string;
      categoryId: string;
      tagId: string;
      dateFrom: string;
      dateTo: string;
    }> = {}) => {
      const path = buildDocumentsQueryPath({
        q: overrides.q ?? q,
        categoryId: overrides.categoryId ?? categoryId,
        tagId: overrides.tagId ?? tagId,
        dateFrom: overrides.dateFrom ?? dateFrom,
        dateTo: overrides.dateTo ?? dateTo,
        page: 1,
      });
      startTransition(() => {
        router.push(path as Route);
      });
    },
    [router, q, categoryId, tagId, dateFrom, dateTo]
  );

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate();
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="size-4 text-primary" />
          Filtros de búsqueda
        </CardTitle>
        <CardDescription>Refina el listado por texto, categoría, etiqueta o fecha.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="q">Texto</Label>
            <Input
              id="q"
              name="q"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
              }}
              placeholder="Título o nombre del archivo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <select
              id="category"
              name="category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
              }}
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px]"
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag">Etiqueta</Label>
            <select
              id="tag"
              name="tag"
              value={tagId}
              onChange={(e) => {
                setTagId(e.target.value);
              }}
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px]"
            >
              <option value="">Todas</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-4">
            <Label>Período rápido</Label>
            <QuickDateFilters
              currentDateFrom={dateFrom}
              currentDateTo={dateTo}
              currentQ={q}
              currentCategory={categoryId}
              currentTag={tagId}
            />
          </div>
          <DateRangeInputs
            key={`${dateFrom}|${dateTo}`}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="submit" className="flex-1 sm:flex-initial" disabled={isPending} loading={isPending}>
              <Search className="size-4" />
              Buscar
            </Button>
            <Button type="button" variant="outline" asChild className="flex-1 sm:flex-initial">
              <Link href="/documents">Limpiar</Link>
            </Button>
          </div>
          {(dateFrom !== "" || dateTo !== "") && (
            <div className="sm:col-span-2 lg:col-span-4">
              <ActiveDateFilterHint dateFrom={dateFrom} dateTo={dateTo} />
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
