"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasPermission } from "@/shared/lib/auth/permissions";
import { CACHE_TAGS } from "@/shared/lib/cache/cached-queries";
import { createClient } from "@/shared/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(120, "El nombre es demasiado largo."),
});

export async function createTagAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user === null) return { status: "error", message: "Debes iniciar sesión." };

  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const session = await getSession();
  if (session === null || !hasPermission(session.permissions, "tags.manage")) {
    return { status: "error", message: "No tienes permiso para crear etiquetas." };
  }

  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .ilike("name", parsed.data.name)
    .maybeSingle();

  if (existing !== null) return { status: "error", message: "Ya existe una etiqueta con ese nombre." };

  const { error } = await supabase.from("tags").insert({ name: parsed.data.name });
  if (error !== null) return { status: "error", message: "No se pudo crear la etiqueta." };

  revalidatePath("/admin/tags");
  revalidateTag(CACHE_TAGS.tags, "default");
  return { status: "success", message: "Etiqueta creada correctamente." };
}
