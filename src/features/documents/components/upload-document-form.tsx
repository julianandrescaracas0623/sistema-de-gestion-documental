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
import { FormField } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
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
          <FormField
            id="file"
            label="Archivo"
            required
            hint="Formatos: PDF, imágenes, Word, Excel (.xlsx), texto. CSV no soportado."
          >
            {(field) => (
              <Input
                ref={fileRef}
                type="file"
                required
                accept={ACCEPT_ATTRIBUTE}
                disabled={isPending}
                {...field}
              />
            )}
          </FormField>
          <FormField id="title" label="Título" required error={errors.title?.message}>
            {(field) => (
              <Input
                disabled={isPending}
                placeholder="Nombre descriptivo"
                {...field}
                {...register("title")}
              />
            )}
          </FormField>
          <FormField
            id="description"
            label="Descripción (opcional)"
            error={errors.description?.message}
          >
            {(field) => (
              <Textarea
                rows={3}
                disabled={isPending}
                placeholder="Opcional"
                {...field}
                {...register("description")}
              />
            )}
          </FormField>
          <FormField id="categoryId" label="Categoría (opcional)">
            {(field) => (
              <Select disabled={isPending} {...field} {...register("categoryId")}>
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <div className="space-y-1.5">
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
