"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { uploadDocumentAction } from "@/features/documents/actions/upload-document.action";
import { TagInput } from "@/features/documents/components/tag-input";
import type { CategoryRow } from "@/features/documents/queries/categories.queries";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  ACCEPT_ATTRIBUTE,
  getFileTypeErrorMessage,
  isFileSizeValid,
  isFileTypeAllowed,
} from "@/shared/lib/upload-utils";

const formSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio.").max(500),
  description: z.string().max(5000).optional(),
  categoryId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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
  maxUploadMb,
}: {
  categories: CategoryRow[];
  availableTags: { id: string; name: string }[];
  maxUploadMb: number;
}) {
  const [state, formAction] = useActionState(uploadDocumentAction, null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", description: "", categoryId: "" },
  });

  useEffect(() => {
    if (state === null || !isActionResult(state)) return;
    if (state.status === "error") {
      toast.error(state.message);
      if (fileRef.current !== null) {
        fileRef.current.value = "";
      }
    }
  }, [state]);

  const clearFileOnly = () => {
    if (fileRef.current !== null) {
      fileRef.current.value = "";
    }
  };

  const onSubmit = handleSubmit((data) => {
    const file = fileRef.current?.files?.[0];
    if (file === undefined) {
      toast.error("Selecciona un archivo válido.");
      return;
    }
    if (!isFileTypeAllowed(file)) {
      toast.error(getFileTypeErrorMessage());
      clearFileOnly();
      return;
    }
    if (!isFileSizeValid(file, maxUploadMb)) {
      toast.error(`El archivo supera el tamaño máximo permitido (${String(maxUploadMb)} MB).`);
      clearFileOnly();
      return;
    }

    const tagsValue =
      formRef.current?.querySelector<HTMLInputElement>('input[name="tags"]')?.value ?? "";

    const fd = new FormData();
    fd.set("title", data.title);
    fd.set("description", data.description ?? "");
    fd.set("categoryId", data.categoryId ?? "");
    fd.set("tags", tagsValue);
    fd.set("file", file);

    startTransition(() => {
      formAction(fd);
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir documento</CardTitle>
        <CardDescription>
          Adjunta el archivo y completa los datos. Tamaño máximo: {String(maxUploadMb)} MB.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          onSubmit={(e) => {
            void onSubmit(e);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="file">Archivo</Label>
            <Input
              id="file"
              ref={fileRef}
              type="file"
              required
              accept={ACCEPT_ATTRIBUTE}
              disabled={isPending}
            />
            <p className="text-muted-foreground text-xs">
              Formatos: PDF, imágenes, Word, Excel (.xlsx), texto. CSV no soportado.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              disabled={isPending}
              placeholder="Nombre descriptivo"
              {...register("title")}
            />
            {errors.title !== undefined ? (
              <p className="text-destructive text-sm">{errors.title.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              disabled={isPending}
              placeholder="Opcional"
              {...register("description")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoría (opcional)</Label>
            <select
              id="categoryId"
              disabled={isPending}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              {...register("categoryId")}
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
          <Button type="submit" disabled={isPending} loading={isPending}>
            {isPending ? "Subiendo…" : "Subir"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
