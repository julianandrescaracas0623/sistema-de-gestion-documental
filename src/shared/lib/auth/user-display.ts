import type { RoleName } from "@/shared/db/user_roles.schema";

export interface UserDisplay {
  initials: string;
  displayName: string;
  emailLocalPart: string | null;
}

/**
 * Derives initials and display label from Supabase user email and metadata (IPS mockup shell).
 */
export function getUserDisplay(
  email: string | null | undefined,
  metadata: Record<string, string | null> | null | undefined
): UserDisplay {
  const emailRaw = email ?? null;
  let emailLocalPart: string | null = null;
  if (typeof emailRaw === "string" && emailRaw.includes("@")) {
    const parts = emailRaw.split("@");
    emailLocalPart = parts[0] ?? null;
  }
  const initials =
    emailLocalPart != null && emailLocalPart.length > 0 ? emailLocalPart.slice(0, 2).toUpperCase() : "??";
  const firstNameMetadata = metadata?.first_name ?? null;
  const displayName = firstNameMetadata ?? emailLocalPart ?? "Usuario";
  return { initials, displayName, emailLocalPart };
}

export function roleLabel(role: RoleName | null): string {
  if (role === "admin") {
    return "Administrador";
  }
  return "Usuario";
}
