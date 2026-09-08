import { CalendarDays, Tag } from "lucide-react";

import { DocumentRowActions } from "@/features/documents/components/document-row-actions";
import { formatFileSize } from "@/features/documents/lib/format-bytes";
import { LocalDate } from "@/shared/components/local-date";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { TableCell, TableRow } from "@/shared/components/ui/table";

export function DocumentTableRow({
  row,
  role,
  selected,
  onToggle,
  showCheckbox,
  canDelete = true,
}: {
  row: {
    id: string;
    title: string;
    size_bytes: number;
    created_at: string;
    uploaded_by: string | null;
    category: { name: string } | null;
    uploader: { email: string } | null;
  };
  role?: string;
  selected?: boolean;
  onToggle?: (id: string) => void;
  showCheckbox?: boolean;
  canDelete?: boolean;
}) {
  return (
    <TableRow data-state={selected === true ? "selected" : undefined}>
      {showCheckbox === true ? (
        <TableCell>
          <Checkbox
            checked={selected === true}
            aria-label={`Seleccionar ${row.title}`}
            onCheckedChange={() => {
              onToggle?.(row.id);
            }}
          />
        </TableCell>
      ) : null}
      <TableCell className="font-medium">{row.title}</TableCell>
      <TableCell className="text-muted-foreground">
        {row.category?.name != null && row.category.name !== "" ? (
          <Badge variant="outline" className="max-w-full truncate">
            <Tag className="size-3" />
            {row.category.name}
          </Badge>
        ) : (
          "Sin categoría"
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">{row.uploader?.email ?? "—"}</span>
          {role != null ? (
            <Badge variant="secondary" className="text-micro w-fit px-1.5 py-0">
              {role}
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{formatFileSize(row.size_bytes)}</TableCell>
      <TableCell className="text-muted-foreground whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          <LocalDate date={row.created_at} />
        </span>
      </TableCell>
      <TableCell className="text-right">
        <DocumentRowActions documentId={row.id} title={row.title} canDelete={canDelete} />
      </TableCell>
    </TableRow>
  );
}
