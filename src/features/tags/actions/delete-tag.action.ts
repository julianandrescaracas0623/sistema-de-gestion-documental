"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { getRoleForUser } from "@/shared/lib/auth/get-role-for-user";
import { createClient } from "@/shared/lib/supabase/server";

const schema = z.object({ id: z.string().uuid("ID inválido.") });

export async function deleteTagAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user === null) return { status: "error", message: "Debes iniciar sesión." };

  const parsed = schema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "ID inválido." };

  const role = await getRoleForUser(supabase, user.id);
  if (role !== "admin") return { status: "error", message: "Solo los administradores pueden eliminar etiquetas." };

  const { error } = await supabase.from("tags").delete().eq("id", parsed.data.id);
  if (error !== null) return { status: "error", message: "No se pudo eliminar la etiqueta." };

  revalidatePath("/admin/tags");
  return { status: "success", message: "Etiqueta eliminada correctamente." };
}
