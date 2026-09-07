"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { recordAudit } from "@/shared/lib/audit/record-audit";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasModulePermission } from "@/shared/lib/auth/permissions";
import { formFieldText } from "@/shared/lib/form-utils";
import { createClient } from "@/shared/lib/supabase/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/service-role";

const updateUserSchema = z.object({
  userId: z.string().uuid("Usuario inválido."),
  fullName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre es demasiado largo"),
  roleId: z.string().uuid("Rol inválido."),
});

type AdminClient = ReturnType<typeof createServiceRoleClient>;

async function countAdminRoleUsers(adminClient: AdminClient, adminRoleId: string): Promise<number> {
  const { count, error } = await adminClient
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role_id", adminRoleId);
  return error !== null ? 0 : (count ?? 0);
}

export async function updateUserByAdminAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  const parsed = updateUserSchema.safeParse({
    userId: formFieldText(formData, "userId"),
    fullName: formFieldText(formData, "fullName"),
    roleId: formFieldText(formData, "roleId"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const session = await getSession();
  if (session === null) {
    return { status: "error", message: "Debes iniciar sesión como administrador." };
  }
  if (!hasModulePermission(session.permissions, "users", "update")) {
    return { status: "error", message: "No tienes permiso para editar usuarios." };
  }

  const { userId, fullName, roleId } = parsed.data;
  if (userId === session.userId) {
    return { status: "error", message: "No puedes editar tu propia cuenta desde aquí." };
  }

  let adminClient: AdminClient;
  try {
    adminClient = createServiceRoleClient();
  } catch {
    return {
      status: "error",
      message:
        "Falta configuración del servidor (SUPABASE_SERVICE_ROLE_KEY). Añádela solo en .env.local del servidor.",
    };
  }

  const { data: targetProfile } = await adminClient
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  if (targetProfile === null) {
    return { status: "error", message: "El usuario no existe o ya fue eliminado." };
  }
  const targetEmail = typeof targetProfile.email === "string" ? targetProfile.email : userId;

  const { data: newRole, error: roleLookupError } = await adminClient
    .from("roles")
    .select("id, slug")
    .eq("id", roleId)
    .maybeSingle();
  if (roleLookupError !== null || newRole === null) {
    return { status: "error", message: "El rol seleccionado no existe." };
  }

  const { data: currentRoleRowRaw } = await adminClient
    .from("user_roles")
    .select("role_id, roles:role_id (slug)")
    .eq("user_id", userId)
    .maybeSingle();
  const currentRoleRow = currentRoleRowRaw as
    | { role_id: string; roles: { slug: string } | { slug: string }[] | null }
    | null;
  const currentRoleData = Array.isArray(currentRoleRow?.roles)
    ? currentRoleRow.roles[0]
    : (currentRoleRow?.roles ?? null);
  const currentRoleSlug = currentRoleData?.slug ?? null;

  // Guard: don't let the last admin be demoted.
  if (currentRoleSlug === "admin" && newRole.slug !== "admin" && currentRoleRow !== null) {
    const adminCount = await countAdminRoleUsers(adminClient, currentRoleRow.role_id);
    if (adminCount <= 1) {
      return {
        status: "error",
        message: "No puedes quitar el rol al único administrador del sistema.",
      };
    }
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);
  if (profileError !== null) {
    return { status: "error", message: "No se pudo actualizar el perfil. Intenta de nuevo." };
  }

  const { error: roleError } = await adminClient
    .from("user_roles")
    .update({ role_id: roleId })
    .eq("user_id", userId);
  if (roleError !== null) {
    return { status: "error", message: "No se pudo actualizar el rol. Intenta de nuevo." };
  }

  await recordAudit(await createClient(), {
    action: "user.update",
    entityType: "user",
    entityId: userId,
    summary: targetEmail,
    metadata: { fullName, roleId, previousRole: currentRoleSlug },
  });

  revalidatePath("/admin/users");
  revalidatePath("/");
  return { status: "success", message: "Usuario actualizado correctamente." };
}
