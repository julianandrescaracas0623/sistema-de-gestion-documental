import { z } from "zod";

import type { SupabaseServer } from "@/features/documents/queries/documents.queries";
import { createServiceRoleClient } from "@/shared/lib/supabase/service-role";

const rowWithIdSchema = z.object({ id: z.string().uuid() });

function normalizeCategoryName(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export async function resolveCategoryId(
  supabase: SupabaseServer,
  selectedCategoryId: string | undefined,
  categoryName: string | undefined
): Promise<{ categoryId: string | null; error: string | null }> {
  const normalizedName = normalizeCategoryName(categoryName);
  if (normalizedName === undefined) {
    return { categoryId: selectedCategoryId ?? null, error: null };
  }

  const { data: existingCategory, error: existingError } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", normalizedName)
    .limit(1)
    .maybeSingle();

  if (existingError !== null) {
    return { categoryId: null, error: "No se pudo validar la categoría indicada." };
  }

  if (existingCategory !== null) {
    const existingParsed = rowWithIdSchema.safeParse(existingCategory);
    if (!existingParsed.success) {
      return { categoryId: null, error: "Respuesta inválida al consultar categoría." };
    }
    return { categoryId: existingParsed.data.id, error: null };
  }

  let adminClient;
  try {
    adminClient = createServiceRoleClient();
  } catch {
    return {
      categoryId: null,
      error: "Falta configuración de servidor para crear categorías automáticamente.",
    };
  }

  const { data: createdCategory, error: createError } = await adminClient
    .from("categories")
    .insert({ name: normalizedName })
    .select("id")
    .single();

  if (createError !== null) {
    return {
      categoryId: null,
      error: "No se pudo crear la nueva categoría. Intenta con otra o selecciona una existente.",
    };
  }

  const createdParsed = rowWithIdSchema.safeParse(createdCategory);
  if (!createdParsed.success) {
    return { categoryId: null, error: "Respuesta inválida al crear categoría." };
  }

  return { categoryId: createdParsed.data.id, error: null };
}
