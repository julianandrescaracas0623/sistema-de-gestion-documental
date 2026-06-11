"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSession } from "@/shared/lib/auth/get-session";
import { hasPermission } from "@/shared/lib/auth/permissions";
import { createServiceRoleClient } from "@/shared/lib/supabase/service-role";

const createUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre es demasiado largo"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  roleId: z.string().uuid("Rol inválido"),
});

export type CreateUserActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

function mapCreateUserError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Ya existe un usuario con ese correo.";
  }
  if (lower.includes("database error saving new user")) {
    return "No se pudo crear el usuario (posible correo duplicado).";
  }
  return "No se pudo crear el usuario. Revisa los datos e inténtalo de nuevo.";
}

export async function createUserByAdminAction(
  _prev: CreateUserActionState,
  formData: FormData
): Promise<CreateUserActionState> {
  const parsed = createUserSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { status: "error", message: msg };
  }

  const session = await getSession();
  if (session === null) {
    return { status: "error", message: "Debes iniciar sesión como administrador." };
  }

  if (!hasPermission(session.permissions, "users.manage")) {
    return { status: "error", message: "No tienes permiso para crear usuarios." };
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

  const { fullName, email, password, roleId } = parsed.data;

  const { data: roleRow, error: roleLookupError } = await adminClient
    .from("roles")
    .select("id")
    .eq("id", roleId)
    .maybeSingle();

  if (roleLookupError !== null || roleRow === null) {
    return { status: "error", message: "El rol seleccionado no existe." };
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError !== null) {
    const msg = createError.message;
    return { status: "error", message: mapCreateUserError(msg) };
  }

  const newId = created.user.id;

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert({ id: newId, email, full_name: fullName }, { onConflict: "id" });

  if (profileError !== null) {
    await adminClient.auth.admin.deleteUser(newId);
    return { status: "error", message: "No se pudo guardar el perfil. Intenta de nuevo." };
  }

  const { error: roleError } = await adminClient.from("user_roles").insert({
    user_id: newId,
    role_id: roleId,
  });

  if (roleError !== null) {
    await adminClient.from("profiles").delete().eq("id", newId);
    await adminClient.auth.admin.deleteUser(newId);
    return { status: "error", message: "No se pudo asignar el rol. Intenta de nuevo." };
  }

  revalidatePath("/");
  revalidatePath("/admin/users");
  return { status: "success" };
}
