import { cache } from "react";

import { getUserAuthContext } from "./get-user-auth-context";

import type { PermissionKey } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";


export interface SessionData {
  userId: string;
  email: string;
  fullName: string;
  roleId: string;
  roleSlug: string;
  roleName: string;
  permissions: PermissionKey[];
  /** @deprecated Use roleSlug or permissions — kept for gradual migration */
  role: "admin" | "user" | null;
}

function readMetadataFullName(metadata: Record<string, unknown> | undefined): string | undefined {
  const value = metadata?.full_name;
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

export const getSession = cache(async (): Promise<SessionData | null> => {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error !== null || user === null) return null;

  const [{ data: profile }, authContext] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    getUserAuthContext(supabase, user.id),
  ]);

  const profileFullName =
    profile !== null && typeof profile.full_name === "string" ? profile.full_name : undefined;
  const profileEmail =
    profile !== null && typeof profile.email === "string" ? profile.email : undefined;

  const emailLocal = user.email?.split("@")[0];
  const fullName =
    profileFullName ??
    readMetadataFullName(user.user_metadata) ??
    emailLocal ??
    "Usuario";

  const roleSlug = authContext?.roleSlug ?? null;
  const legacyRole =
    roleSlug === "admin" ? "admin" : roleSlug === "user" ? "user" : null;

  return {
    userId: user.id,
    email: profileEmail ?? user.email ?? "",
    fullName,
    roleId: authContext?.roleId ?? "",
    roleSlug: authContext?.roleSlug ?? "",
    roleName: authContext?.roleName ?? "",
    permissions: authContext?.permissions ?? [],
    role: legacyRole,
  };
});
