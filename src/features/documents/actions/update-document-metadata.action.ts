"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { resolveCategoryId } from "@/features/documents/lib/resolve-category-id";
import { parseTagInput } from "@/features/documents/lib/tag-utils";
import type { ActionResult } from "@/shared/lib/action-result";
import { formFieldText } from "@/shared/lib/form-utils";
import { createClient } from "@/shared/lib/supabase/server";

const rowWithIdSchema = z.object({ id: z.string().uuid() });

const existingDocSchema = z.object({
  id: z.string().uuid(),
  deleted_at: z.string().nullable(),
});

const schema = z.object({
  documentId: z.string().uuid("Documento inválido."),
  title: z.string().trim().min(1, "El título es obligatorio.").max(500),
  description: z.string().max(5000).optional(),
  categoryId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().uuid().optional()
  ),
  categoryName: z.string().trim().max(120, "La categoría es demasiado larga.").optional(),
  tagsRaw: z.string().max(2000).optional(),
});

export async function updateDocumentMetadataAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { status: "error", message: "Debes iniciar sesión." };
  }

  const parsed = schema.safeParse({
    documentId: formFieldText(formData, "documentId"),
    title: formFieldText(formData, "title"),
    description: formFieldText(formData, "description"),
    categoryId: formFieldText(formData, "categoryId"),
    categoryName: formFieldText(formData, "categoryName"),
    tagsRaw: formFieldText(formData, "tags"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { status: "error", message: msg };
  }

  const { documentId, title, description, categoryId, categoryName, tagsRaw } = parsed.data;

  const { data: existing, error: fetchErr } = await supabase
    .from("documents")
    .select("id, deleted_at")
    .eq("id", documentId)
    .maybeSingle();

  if (fetchErr !== null) {
    return { status: "error", message: "No se pudo cargar el documento." };
  }
  if (existing === null) {
    return { status: "error", message: "El documento no existe." };
  }

  const existingParsed = existingDocSchema.safeParse(existing);
  if (!existingParsed.success) {
    return { status: "error", message: "Datos del documento inválidos." };
  }
  if (existingParsed.data.deleted_at !== null) {
    return { status: "error", message: "Este documento ya fue eliminado." };
  }

  const descriptionValue =
    description === undefined || description === "" ? null : description;

  const { categoryId: resolvedCategoryId, error: categoryError } = await resolveCategoryId(
    supabase,
    categoryId,
    categoryName
  );
  if (categoryError !== null) {
    return { status: "error", message: categoryError };
  }

  const { error: updErr } = await supabase
    .from("documents")
    .update({
      title,
      description: descriptionValue,
      category_id: resolvedCategoryId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  if (updErr !== null) {
    return { status: "error", message: `No se pudo actualizar: ${updErr.message}` };
  }

  const { error: delTagsErr } = await supabase.from("document_tags").delete().eq("document_id", documentId);
  if (delTagsErr !== null) {
    return { status: "error", message: "No se pudieron actualizar las etiquetas." };
  }

  const labels = parseTagInput(tagsRaw);
  for (const name of labels) {
    const { data: tagRow, error: tagSelErr } = await supabase.from("tags").select("id").eq("name", name).maybeSingle();
    if (tagSelErr !== null) {
      return { status: "error", message: "Error al leer etiquetas." };
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
        return { status: "error", message: "No se pudo crear una etiqueta." };
      }
      const createdParsed = rowWithIdSchema.safeParse(createdTag);
      if (!createdParsed.success) {
        return { status: "error", message: "Respuesta inválida al crear etiqueta." };
      }
      tagId = createdParsed.data.id;
    }

    const { error: linkErr } = await supabase.from("document_tags").insert({
      document_id: documentId,
      tag_id: tagId,
    });
    if (linkErr !== null) {
      return { status: "error", message: "No se pudo vincular una etiqueta." };
    }
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  return { status: "success", message: "Cambios guardados." };
}
