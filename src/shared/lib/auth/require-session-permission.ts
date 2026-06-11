import type { SessionData } from "@/shared/lib/auth/get-session";
import { hasPermission, type PermissionKey } from "@/shared/lib/auth/permissions";

export function sessionHasPermission(
  session: SessionData | null,
  key: PermissionKey
): session is SessionData {
  if (session === null) return false;
  return hasPermission(session.permissions, key);
}
