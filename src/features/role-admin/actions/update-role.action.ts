"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/shared/lib/action-result";
import { recordAudit } from "@/shared/lib/audit/record-audit";
import { getSession } from "@/shared/lib/auth/get-session";
import {
  hasModulePermission,
  permissionsNotGrantableBy,
  PERMISSION_KEYS,
  type PermissionKey,
} from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

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
  if (!hasModulePermission(session.permissions, "roles", "update")) {
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

  if (parsed.data.id === session.roleId) {
    return { status: "error", message: "No puedes editar tu propio rol." };
  }

  const permissionKeys = parsePermissionKeys(parsed.data.permissionKeys);

  const notGrantable = permissionsNotGrantableBy(session.permissions, permissionKeys);
  if (notGrantable.length > 0) {
    return {
      status: "error",
      message: `No puedes otorgar permisos que tú no tienes: ${notGrantable.join(", ")}.`,
    };
  }

  const supabase = await createClient();

  const { data: roleRow, error: roleLookupError } = await supabase
    .from("roles")
    .select("id, is_system, slug")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (roleLookupError !== null || roleRow === null) {
    return { status: "error", message: "El rol no existe." };
  }

  const { data: updated, error: rpcError } = (await supabase.rpc("update_role_with_permissions", {
    p_role_id: parsed.data.id,
    p_name: parsed.data.name,
    p_description: parsed.data.description ?? null,
    p_permission_keys: permissionKeys,
  })) as { data: boolean | null; error: { message: string } | null };

  if (rpcError !== null) {
    if (rpcError.message.includes("invalid_permission_keys")) {
      return { status: "error", message: "Uno o más permisos no son válidos." };
    }
    return { status: "error", message: "No se pudo actualizar el rol." };
  }
  if (updated !== true) {
    return { status: "error", message: "No tienes permiso para editar este rol." };
  }

  await recordAudit(supabase, {
    action: "role.update",
    entityType: "role",
    entityId: parsed.data.id,
    summary: parsed.data.name,
    metadata: { permissionKeys },
  });

  revalidatePath("/admin/roles");
  return { status: "success", message: "Rol actualizado correctamente." };
}
