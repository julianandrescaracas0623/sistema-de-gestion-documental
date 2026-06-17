import { CalendarDays, Download, FileText, Tag, Upload } from "lucide-react";
import Link from "next/link";

import { DocumentRowActions } from "@/features/documents/components/document-row-actions";
import { formatFileSize } from "@/features/documents/lib/format-bytes";
import { LocalDate } from "@/shared/components/local-date";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export function DocumentTableRow({
  row,
  role,
  selected,
  onToggle,
  showCheckbox,
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
}) {
  return (
    <tr className="border-border hover:bg-muted/50 border-b transition-colors last:border-b-0">
      {showCheckbox === true ? (
        <td className="px-4 py-4">
          <input
            type="checkbox"
            checked={selected === true}
            aria-label={`Seleccionar ${row.title}`}
            onChange={() => {
              onToggle?.(row.id);
            }}
            className="size-4 rounded border-input"
          />
        </td>
      ) : null}
      <td className="px-6 py-4 font-medium">{row.title}</td>
      <td className="px-6 py-4 text-muted-foreground">
        {row.category?.name != null && row.category.name !== "" ? (
          <Badge variant="outline" className="max-w-full truncate">
            <Tag className="size-3" />
            {row.category.name}
          </Badge>
        ) : (
          "Sin categoría"
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">{row.uploader?.email ?? "—"}</span>
          {role != null ? (
            <Badge variant="secondary" className="w-fit px-1.5 py-0 text-[10px]">
              {role}
            </Badge>
          ) : null}
        </div>
      </td>
      <td className="px-6 py-4 text-muted-foreground">{formatFileSize(row.size_bytes)}</td>
      <td className="px-6 py-4 text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          <LocalDate date={row.created_at} />
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end">
          <DocumentRowActions documentId={row.id} title={row.title} />
        </div>
      </td>
    </tr>
  );
}

export function DocumentsTableHeaderActions({
  total,
  exportQuery,
}: {
  total: number;
  exportQuery: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild size="sm">
        <Link href="/documents/new">
          <Upload className="size-4" />
          Subir documento
        </Link>
      </Button>
      <Badge variant="outline">{String(total)} en total</Badge>
      {total > 0 ? (
        <a
          href={`/api/documents/export?${exportQuery}`}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
        >
          <Download className="size-3.5" />
          Descargar archivos ({String(total)})
        </a>
      ) : null}
    </div>
  );
}

export function DocumentsTableShell({ children }: { children: React.ReactNode }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-primary" />
            Listado de documentos
          </CardTitle>
        </div>
        <CardDescription className="sr-only">Tabla de documentos filtrados</CardDescription>
      </CardHeader>
      {children}
    </Card>
  );
}
