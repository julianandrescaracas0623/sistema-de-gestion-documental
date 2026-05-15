import { redirect } from "next/navigation";

import { IpsAppShell } from "@/shared/components/ips-app-shell";
import { getRoleForUser } from "@/shared/lib/auth/get-role-for-user";
import { getUserDisplay } from "@/shared/lib/auth/user-display";
import { createClient } from "@/shared/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    redirect("/login");
    return null;
  }

  const role = await getRoleForUser(supabase, user.id);
  const email = user.email ?? "usuario@ips.com";
  const metadata = user.user_metadata as Record<string, string | null> | null;
  const { initials, displayName } = getUserDisplay(email, metadata);

  return (
    <IpsAppShell email={email} role={role} initials={initials} displayName={displayName}>
      {children}
    </IpsAppShell>
  );
}
