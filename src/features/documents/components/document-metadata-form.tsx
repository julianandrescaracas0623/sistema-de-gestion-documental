"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { updateDocumentMetadataAction } from "@/features/documents/actions/update-document-metadata.action";
import type { CategoryRow } from "@/features/documents/queries/categories.queries";
import type { DocumentDetailRow } from "@/features/documents/queries/documents.queries";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

function isActionResult(v: unknown): v is { status: "success" | "error"; message: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    "status" in v &&
    (v as { status: string }).status !== "idle" &&
    "message" in v
  );
}

function tagsToInput(doc: DocumentDetailRow): string {
  const parts = doc.document_tags
    .map((row) => (row.tag !== null ? row.tag.name : null))
    .filter((n): n is string => n !== null && n !== "");
  return parts.join(", ");
}

export function DocumentMetadataForm({
  document,
  categories,
}: {
  document: DocumentDetailRow;
  categories: CategoryRow[];
}) {
  const [state, formAction, isPending] = useActionState(updateDocumentMetadataAction, null);

  useEffect(() => {
    if (state === null || !isActionResult(state)) {
      return;
    }
    if (state.status === "success") {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border p-4">
      <input type="hidden" name="documentId" value={document.id} />
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required maxLength={500} defaultValue={document.title} disabled={isPending} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          name="description"
          maxLength={5000}
          defaultValue={document.description ?? ""}
          disabled={isPending}
          placeholder="Opcional"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoryId">Categoría</Label>
        <select
          id="categoryId"
          name="categoryId"
          disabled={isPending}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue={document.category !== null ? document.category.id : ""}
        >
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Etiquetas</Label>
        <Input id="tags" name="tags" defaultValue={tagsToInput(document)} disabled={isPending} placeholder="Separadas por coma" />
      </div>
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
