import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { userRoles, type RoleName } from "@/shared/db/user_roles.schema";

export async function getRoleForUser(userId: string): Promise<RoleName | null> {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId))
    .limit(1);

  const role = rows[0]?.role;
  return role ?? null;
}
