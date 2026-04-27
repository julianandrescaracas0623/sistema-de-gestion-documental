"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { DOCUMENTS_STORAGE_BUCKET, getMaxDocumentUploadMb } from "@/features/documents/lib/documents-config";
import { resolveCategoryId } from "@/features/documents/lib/resolve-category-id";
import { sanitizeStorageFilename } from "@/features/documents/lib/sanitize-storage-filename";
import { parseTagInput } from "@/features/documents/lib/tag-utils";
import type { ActionResult } from "@/shared/lib/action-result";
import { formFieldText } from "@/shared/lib/form-utils";
import { createClient } from "@/shared/lib/supabase/server";
import { isFileSizeValid, isFileTypeAllowed, readUploadFileBuffer } from "@/shared/lib/upload-utils";

const rowWithIdSchema = z.object({ id: z.string().uuid() });

const uploadDocumentSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio.").max(500, "El título es demasiado largo."),
  categoryId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().uuid("Categoría inválida.").optional()
  ),
  categoryName: z.string().trim().max(120, "La categoría es demasiado larga.").optional(),
  tagsRaw: z.string().max(2000).optional(),
});

export async function uploadDocumentAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { status: "error", message: "Debes iniciar sesión para subir documentos." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { status: "error", message: "Selecciona un archivo válido." };
  }
  if (file.size === 0) {
    return { status: "error", message: "El archivo está vacío." };
  }

  const maxMb = getMaxDocumentUploadMb();
  if (!isFileSizeValid(file, maxMb)) {
    return {
      status: "error",
      message: `El archivo supera el tamaño máximo permitido (${String(maxMb)} MB).`,
    };
  }

  if (!isFileTypeAllowed(file)) {
    return {
      status: "error",
      message: "Tipo de archivo no permitido. Usa PDF, imágenes, Office o texto plano.",
    };
  }

  const parsed = uploadDocumentSchema.safeParse({
    title: formFieldText(formData, "title"),
    categoryId: formFieldText(formData, "categoryId"),
    categoryName: formFieldText(formData, "categoryName"),
    tagsRaw: formFieldText(formData, "tags"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { status: "error", message: msg };
  }

  const { categoryId, error: categoryError } = await resolveCategoryId(
    supabase,
    parsed.data.categoryId,
    parsed.data.categoryName
  );
  if (categoryError !== null) {
    return { status: "error", message: categoryError };
  }

  const documentId = randomUUID();
  const safeName = sanitizeStorageFilename(file.name);
  const storagePath = `${user.id}/${documentId}/${safeName}`;

  const buffer = await readUploadFileBuffer(file);
  const body = new Uint8Array(buffer);

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_STORAGE_BUCKET)
    .upload(storagePath, body, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError !== null) {
    return {
      status: "error",
      message: `No se pudo subir el archivo al almacenamiento: ${uploadError.message}`,
    };
  }

  const { error: insertError } = await supabase
    .from("documents")
    .insert({
      id: documentId,
      title: parsed.data.title,
      description: null,
      file_name: file.name,
      storage_object_path: storagePath,
      size_bytes: file.size,
      mime_type: file.type,
      category_id: categoryId,
      uploaded_by: user.id,
    })
    .select("id")
    .single();

  if (insertError !== null) {
    await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove([storagePath]);
    return {
      status: "error",
      message: `No se pudo registrar el documento: ${insertError.message}`,
    };
  }
  const labels = parseTagInput(parsed.data.tagsRaw);
  for (const name of labels) {
    const { data: tagRow, error: tagSelErr } = await supabase.from("tags").select("id").eq("name", name).maybeSingle();

    if (tagSelErr !== null) {
      await supabase.from("documents").delete().eq("id", documentId);
      await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove([storagePath]);
      return { status: "error", message: "No se pudieron guardar las etiquetas." };
    }

    let tagId: string | undefined;
    if (tagRow !== null) {
      const parsedExisting = rowWithIdSchema.safeParse(tagRow);
      if (parsedExisting.success) {
        tagId = parsedExisting.data.id;
      }
    }
    if (tagId === undefined) {
      const { data: createdTag, error: tagInsErr } = await supabase
        .from("tags")
        .insert({ name })
        .select("id")
        .single();
      if (tagInsErr !== null) {
        await supabase.from("documents").delete().eq("id", documentId);
        await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove([storagePath]);
        return { status: "error", message: "No se pudieron crear las etiquetas." };
      }
      const createdParsed = rowWithIdSchema.safeParse(createdTag);
      if (!createdParsed.success) {
        await supabase.from("documents").delete().eq("id", documentId);
        await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove([storagePath]);
        return { status: "error", message: "Respuesta inválida al crear etiqueta." };
      }
      tagId = createdParsed.data.id;
    }

    const { error: linkErr } = await supabase.from("document_tags").insert({
      document_id: documentId,
      tag_id: tagId,
    });
    if (linkErr !== null) {
      await supabase.from("documents").delete().eq("id", documentId);
      await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove([storagePath]);
      return { status: "error", message: "No se pudo vincular una etiqueta." };
    }
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}
