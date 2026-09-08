"use client";

import { Download } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { actionLabel } from "@/features/audit/lib/audit-labels";
import { buildAuditQuery, type AuditSearchParams } from "@/features/audit/lib/audit-search-params";
import { DateRangeInputs } from "@/features/documents/components/date-range-inputs";
import { FilterChips, FilterPopover } from "@/shared/components/filter-popover";
import { TableSearch } from "@/shared/components/table-search";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";

export function AuditToolbar({
  params,
  actions,
  exportQuery,
}: {
  params: AuditSearchParams;
  actions: string[];
  exportQuery: string;
}) {
  const router = useRouter();
  const [draftAction, setDraftAction] = useState(params.action);
  const [draftFrom, setDraftFrom] = useState(params.dateFrom);
  const [draftTo, setDraftTo] = useState(params.dateTo);

  useEffect(() => {
    setDraftAction(params.action);
    setDraftFrom(params.dateFrom);
    setDraftTo(params.dateTo);
  }, [params.action, params.dateFrom, params.dateTo]);

  const navigate = (next: Partial<AuditSearchParams>) => {
    const query = buildAuditQuery({
      actor: params.actor,
      action: params.action,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      pageSize: params.pageSize,
      ...next,
      page: 1,
    });
    router.push(`/admin/actividad${query}` as Route);
  };

  const activeCount =
    (params.action !== "" ? 1 : 0) + (params.dateFrom !== "" || params.dateTo !== "" ? 1 : 0);

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (params.action !== "") {
    chips.push({
      key: "action",
      label: `Acción: ${actionLabel(params.action)}`,
      onRemove: () => { navigate({ action: "" }); },
    });
  }
  if (params.dateFrom !== "" || params.dateTo !== "") {
    const label =
      params.dateFrom !== "" && params.dateTo !== ""
        ? `${params.dateFrom} – ${params.dateTo}`
        : params.dateFrom !== ""
          ? `Desde ${params.dateFrom}`
          : `Hasta ${params.dateTo}`;
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
            value={params.actor}
            debounceMs={350}
            placeholder="Buscar por usuario (correo)…"
            onChange={(next) => { navigate({ actor: next }); }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterPopover
            activeCount={activeCount}
            onApply={() => {
              navigate({ action: draftAction, dateFrom: draftFrom, dateTo: draftTo });
            }}
            onClear={() => {
              router.push("/admin/actividad");
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="flt-action">Acción</Label>
              <Select
                id="flt-action"
                value={draftAction}
                onChange={(e) => { setDraftAction(e.target.value); }}
              >
                <option value="">Todas</option>
                {actions.map((a) => (
                  <option key={a} value={a}>
                    {actionLabel(a)}
                  </option>
                ))}
              </Select>
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

          <Button variant="outline" size="sm" asChild>
            <a href={`/api/audit/export${exportQuery}`}>
              <Download className="size-3.5" />
              Exportar CSV
            </a>
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
