import type { PermissionKey } from "@/shared/lib/auth/permissions";

export interface UserDisplay {
  initials: string;
  displayName: string;
  emailLocalPart: string | null;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => p.length > 0);
  if (parts.length === 0) return "??";
  const first = parts[0];
  if (first === undefined) return "??";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const second = parts[1];
  return `${first[0] ?? ""}${second?.[0] ?? ""}`.toUpperCase();
}

export function getUserDisplay(
  email: string | null | undefined,
  fullName: string | null | undefined,
  metadata?: Record<string, string | null> | null
): UserDisplay {
  const emailRaw = email ?? null;
  let emailLocalPart: string | null = null;
  if (typeof emailRaw === "string" && emailRaw.includes("@")) {
    const parts = emailRaw.split("@");
    emailLocalPart = parts[0] ?? null;
  }

  const resolvedName =
    (fullName !== undefined && fullName !== null && fullName.trim() !== ""
      ? fullName.trim()
      : null) ??
    metadata?.full_name ??
    metadata?.first_name ??
    emailLocalPart ??
    "Usuario";

  const initials = initialsFromName(resolvedName);

  return { initials, displayName: resolvedName, emailLocalPart };
}

export function roleLabel(roleName: string | null, roleSlug?: string | null): string {
  if (roleName !== null && roleName !== "") return roleName;
  if (roleSlug === "admin") return "Administrador";
  if (roleSlug === "user") return "Usuario administrativo";
  return "Usuario";
}

export { hasPermission, hasAnyPermission } from "@/shared/lib/auth/permissions";

export type { PermissionKey };
