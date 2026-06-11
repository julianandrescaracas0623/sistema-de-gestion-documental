"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasPermission, PERMISSION_KEYS, type PermissionKey } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

const rowWithIdSchema = z.object({ id: z.string().uuid() });

function parsePermissionKeys(raw: string): PermissionKey[] {
  const keys = raw
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
  return keys.filter((k): k is PermissionKey => (PERMISSION_KEYS as readonly string[]).includes(k));
}

const updateRoleSchema = z.object({
  id: z.string().uuid("Rol inválido."),
  name: z.string().trim().min(2).max(80),
  description: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().trim().max(500).optional()
  ),
  permissionKeys: z.string().refine((s) => parsePermissionKeys(s).length > 0, {
    message: "Selecciona al menos un permiso",
  }),
});

export async function updateRoleAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (session === null) {
    return { status: "error", message: "Debes iniciar sesión." };
  }
  if (!hasPermission(session.permissions, "roles.manage")) {
    return { status: "error", message: "No tienes permiso para editar roles." };
  }

  const parsed = updateRoleSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    permissionKeys: formData.get("permissionKeys"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const permissionKeys = parsePermissionKeys(parsed.data.permissionKeys);
  const supabase = await createClient();

  const { data: roleRow, error: roleLookupError } = await supabase
    .from("roles")
    .select("id, is_system, slug")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (roleLookupError !== null || roleRow === null) {
    return { status: "error", message: "El rol no existe." };
  }

  const updatePayload: { name: string; description: string | null; updated_at: string } = {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("roles")
    .update(updatePayload)
    .eq("id", parsed.data.id);

  if (updateError !== null) {
    return { status: "error", message: "No se pudo actualizar el rol." };
  }

  const { error: deleteLinksError } = await supabase
    .from("role_permissions")
    .delete()
    .eq("role_id", parsed.data.id);

  if (deleteLinksError !== null) {
    return { status: "error", message: "No se pudieron actualizar los permisos." };
  }

  const { data: perms, error: permsError } = await supabase
    .from("permissions")
    .select("id, key")
    .in("key", permissionKeys);

  if (permsError !== null || perms.length !== permissionKeys.length) {
    return { status: "error", message: "Uno o más permisos no son válidos." };
  }

  const parsedPerms = perms
    .map((row) => rowWithIdSchema.safeParse(row))
    .filter((r) => r.success);

  if (parsedPerms.length !== permissionKeys.length) {
    return { status: "error", message: "Uno o más permisos no son válidos." };
  }

  const { error: linkError } = await supabase.from("role_permissions").insert(
    parsedPerms.map((p) => ({
      role_id: parsed.data.id,
      permission_id: p.data.id,
    }))
  );

  if (linkError !== null) {
    return { status: "error", message: "No se pudieron asignar los permisos al rol." };
  }

  revalidatePath("/admin/roles");
  return { status: "success", message: "Rol actualizado correctamente." };
}
