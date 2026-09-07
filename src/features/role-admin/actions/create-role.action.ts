"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { slugifyRoleName } from "@/features/role-admin/lib/slugify-role";
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

const createRoleSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
  description: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().trim().max(500).optional()
  ),
  permissionKeys: z.string().refine((s) => parsePermissionKeys(s).length > 0, {
    message: "Selecciona al menos un permiso",
  }),
});

export async function createRoleAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (session === null) {
    return { status: "error", message: "Debes iniciar sesión." };
  }
  if (!hasModulePermission(session.permissions, "roles", "create")) {
    return { status: "error", message: "No tienes permiso para crear roles." };
  }

  const parsed = createRoleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    permissionKeys: formData.get("permissionKeys"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const permissionKeys = parsePermissionKeys(parsed.data.permissionKeys);

  const notGrantable = permissionsNotGrantableBy(session.permissions, permissionKeys);
  if (notGrantable.length > 0) {
    return {
      status: "error",
      message: `No puedes otorgar permisos que tú no tienes: ${notGrantable.join(", ")}.`,
    };
  }

  const baseSlug = slugifyRoleName(parsed.data.name);
  if (baseSlug.length < 2) {
    return { status: "error", message: "El nombre no genera un identificador válido." };
  }

  const supabase = await createClient();

  let slug = baseSlug;
  for (let i = 0; i < 5; i += 1) {
    const { data: existing } = await supabase.from("roles").select("id").eq("slug", slug).maybeSingle();
    if (existing === null) break;
    slug = `${baseSlug}-${String(i + 2)}`;
  }

  const { data: roleId, error: rpcError } = (await supabase.rpc("create_role_with_permissions", {
    p_slug: slug,
    p_name: parsed.data.name,
    p_description: parsed.data.description ?? null,
    p_permission_keys: permissionKeys,
  })) as { data: string | null; error: { message: string } | null };

  if (rpcError !== null) {
    if (rpcError.message.includes("invalid_permission_keys")) {
      return { status: "error", message: "Uno o más permisos no son válidos." };
    }
    return { status: "error", message: "No se pudo crear el rol." };
  }

  const parsedRoleId = z.string().uuid().safeParse(roleId);
  if (!parsedRoleId.success) {
    return { status: "error", message: "No se pudo crear el rol." };
  }

  await recordAudit(supabase, {
    action: "role.create",
    entityType: "role",
    entityId: parsedRoleId.data,
    summary: parsed.data.name,
    metadata: { slug, permissionKeys },
  });

  revalidatePath("/admin/roles");
  return { status: "success", message: "Rol creado correctamente." };
}
