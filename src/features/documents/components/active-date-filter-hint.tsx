"use client";

import { findActiveQuickFilter, formatDateRangeLabel } from "@/features/documents/lib/date-utils";
import { Badge } from "@/shared/components/ui/badge";

export function ActiveDateFilterHint({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}) {
  if (dateFrom === "" && dateTo === "") return null;

  const preset = findActiveQuickFilter(dateFrom, dateTo);
  const rangeLabel = formatDateRangeLabel(dateFrom, dateTo);

  return (
    <Badge variant="secondary" className="font-normal">
      {preset !== null
        ? `Mostrando documentos del ${rangeLabel} (${preset.label})`
        : `Mostrando documentos del ${rangeLabel}`}
    </Badge>
  );
}
