"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { uploadDocumentAction } from "@/features/documents/actions/upload-document.action";
import { TagInput } from "@/features/documents/components/tag-input";
import type { CategoryRow } from "@/features/documents/queries/categories.queries";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
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

export function UploadDocumentForm({
  categories,
  availableTags,
}: {
  categories: CategoryRow[];
  availableTags: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(uploadDocumentAction, null);

  useEffect(() => {
    if (state === null || !isActionResult(state)) return;
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir documento</CardTitle>
        <CardDescription>Adjunta el archivo y completa los datos. Tamaño máximo según configuración del servidor.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Archivo</Label>
            <Input id="file" name="file" type="file" required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required maxLength={500} disabled={isPending} placeholder="Nombre descriptivo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input id="description" name="description" maxLength={5000} disabled={isPending} placeholder="Opcional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoría (opcional)</Label>
            <select
              id="categoryId"
              name="categoryId"
              disabled={isPending}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue=""
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
            <Label>Etiquetas (opcional)</Label>
            <TagInput name="tags" availableTags={availableTags} disabled={isPending} />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Subiendo…" : "Subir"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
