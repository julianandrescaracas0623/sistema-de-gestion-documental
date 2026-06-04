"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { getRoleForUser } from "@/shared/lib/auth/get-role-for-user";
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

  const role = await getRoleForUser(supabase, user.id);
  if (role !== "admin") return { status: "error", message: "Solo los administradores pueden crear etiquetas." };

  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .ilike("name", parsed.data.name)
    .maybeSingle();

  if (existing !== null) return { status: "error", message: "Ya existe una etiqueta con ese nombre." };

  const { error } = await supabase.from("tags").insert({ name: parsed.data.name });
  if (error !== null) return { status: "error", message: "No se pudo crear la etiqueta." };

  revalidatePath("/admin/tags");
  return { status: "success", message: "Etiqueta creada correctamente." };
}
