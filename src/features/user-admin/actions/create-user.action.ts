"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ROLE_NAMES } from "@/shared/db/user_roles.schema";
import { getRoleForUser } from "@/shared/lib/auth/get-role-for-user";
import { createClient } from "@/shared/lib/supabase/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/service-role";

const createUserSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(ROLE_NAMES),
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
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { status: "error", message: msg };
  }

  const supabase = await createClient();
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (adminUser === null) {
    return { status: "error", message: "Debes iniciar sesión como administrador." };
  }

  const adminRole = await getRoleForUser(supabase, adminUser.id);
  if (adminRole !== "admin") {
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

  const { email, password, role: newRole } = parsed.data;

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError !== null) {
    const msg = createError.message;
    return { status: "error", message: mapCreateUserError(msg) };
  }

  const newId = created.user.id;

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert({ id: newId, email }, { onConflict: "id" });

  if (profileError !== null) {
    await adminClient.auth.admin.deleteUser(newId);
    return { status: "error", message: "No se pudo guardar el perfil. Intenta de nuevo." };
  }

  const { error: roleError } = await adminClient.from("user_roles").insert({
    user_id: newId,
    role: newRole,
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
