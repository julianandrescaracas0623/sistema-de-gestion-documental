"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasPermission } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

const deleteRoleSchema = z.object({
  id: z.string().uuid("Rol inválido."),
});

export async function deleteRoleAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (session === null) {
    return { status: "error", message: "Debes iniciar sesión." };
  }
  if (!hasPermission(session.permissions, "roles.manage")) {
    return { status: "error", message: "No tienes permiso para eliminar roles." };
  }

  const parsed = deleteRoleSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();

  const { data: roleRow, error: roleLookupError } = await supabase
    .from("roles")
    .select("id, is_system, name")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (roleLookupError !== null || roleRow === null) {
    return { status: "error", message: "El rol no existe." };
  }

  if (roleRow.is_system === true) {
    return { status: "error", message: "Los roles del sistema no se pueden eliminar." };
  }

  const { count, error: countError } = await supabase
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role_id", parsed.data.id);

  if (countError !== null) {
    return { status: "error", message: "No se pudo verificar usuarios asignados." };
  }

  if ((count ?? 0) > 0) {
    return {
      status: "error",
      message: `No se puede eliminar: ${String(count)} usuario(s) tienen asignado este rol.`,
    };
  }

  const { error: deleteError } = await supabase.from("roles").delete().eq("id", parsed.data.id);

  if (deleteError !== null) {
    return { status: "error", message: "No se pudo eliminar el rol." };
  }

  revalidatePath("/admin/roles");
  return { status: "success", message: "Rol eliminado correctamente." };
}
