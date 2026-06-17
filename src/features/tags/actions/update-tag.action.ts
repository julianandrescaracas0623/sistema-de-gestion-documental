"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasModulePermission } from "@/shared/lib/auth/permissions";
import { CACHE_TAGS } from "@/shared/lib/cache/cached-queries";
import { createClient } from "@/shared/lib/supabase/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/service-role";

const schema = z.object({
  id: z.string().uuid("ID inválido."),
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(120, "El nombre es demasiado largo."),
});

export async function updateTagAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user === null) return { status: "error", message: "Debes iniciar sesión." };

  const parsed = schema.safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const session = await getSession();
  if (session === null || !hasModulePermission(session.permissions, "tags", "update")) {
    return { status: "error", message: "No tienes permiso para editar etiquetas." };
  }

  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .ilike("name", parsed.data.name)
    .neq("id", parsed.data.id)
    .maybeSingle();

  if (existing !== null) return { status: "error", message: "Ya existe una etiqueta con ese nombre." };

  const adminClient = createServiceRoleClient();
  const { error } = await adminClient.from("tags").update({ name: parsed.data.name }).eq("id", parsed.data.id);
  if (error !== null) return { status: "error", message: "No se pudo actualizar la etiqueta." };

  revalidatePath("/admin/tags");
  revalidateTag(CACHE_TAGS.tags, "default");
  return { status: "success", message: "Etiqueta actualizada correctamente." };
}
