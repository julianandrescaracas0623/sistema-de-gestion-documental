"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasModulePermission } from "@/shared/lib/auth/permissions";
import { formFieldText } from "@/shared/lib/form-utils";
import { createServiceRoleClient } from "@/shared/lib/supabase/service-role";

const deleteUserSchema = z.object({
  userId: z.string().uuid("Usuario inválido."),
});

async function countAdminRoleUsers(
  adminClient: ReturnType<typeof createServiceRoleClient>
): Promise<number> {
  const { data: adminRole, error: roleError } = await adminClient
    .from("roles")
    .select("id")
    .eq("slug", "admin")
    .maybeSingle();

  if (roleError !== null || adminRole === null) {
    return 0;
  }

  const { count, error } = await adminClient
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role_id", adminRole.id);

  if (error !== null) {
    return 0;
  }
  return count ?? 0;
}

async function getTargetRoleSlug(
  adminClient: ReturnType<typeof createServiceRoleClient>,
  userId: string
): Promise<string | null> {
  const { data, error } = await adminClient
    .from("user_roles")
    .select("roles:role_id (slug)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error !== null || data === null) {
    return null;
  }

  const rawRoles = data.roles as { slug: string } | { slug: string }[] | null;
  const role = Array.isArray(rawRoles) ? rawRoles[0] : rawRoles;
  return role?.slug ?? null;
}

export async function deleteUserByAdminAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = deleteUserSchema.safeParse({
    userId: formFieldText(formData, "userId"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { status: "error", message: msg };
  }

  const session = await getSession();
  if (session === null) {
    return { status: "error", message: "Debes iniciar sesión como administrador." };
  }

  if (!hasModulePermission(session.permissions, "users", "delete")) {
    return { status: "error", message: "No tienes permiso para eliminar usuarios." };
  }

  const { userId } = parsed.data;

  if (userId === session.userId) {
    return { status: "error", message: "No puedes eliminar tu propia cuenta." };
  }

  let adminClient;
  try {
    adminClient = createServiceRoleClient();
  } catch {
    return {
      status: "error",
      message:
        "Falta configuración del servidor (SUPABASE_SERVICE_ROLE_KEY). Añádela solo en .env.local del servidor.",
    };
  }

  const targetRoleSlug = await getTargetRoleSlug(adminClient, userId);
  if (targetRoleSlug === null) {
    return { status: "error", message: "El usuario no existe o ya fue eliminado." };
  }

  if (targetRoleSlug === "admin") {
    const adminCount = await countAdminRoleUsers(adminClient);
    if (adminCount <= 1) {
      return { status: "error", message: "No puedes eliminar al único administrador del sistema." };
    }
  }

  const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
  if (authError !== null) {
    return { status: "error", message: "No se pudo eliminar la cuenta. Inténtalo de nuevo." };
  }

  const { error: profileError } = await adminClient.from("profiles").delete().eq("id", userId);
  if (profileError !== null) {
    return {
      status: "error",
      message:
        "La cuenta de acceso fue eliminada, pero no se pudo limpiar el perfil. Contacta al soporte técnico.",
    };
  }

  revalidatePath("/admin/users");
  revalidatePath("/documents");
  return { status: "success", message: "Usuario eliminado correctamente." };
}
