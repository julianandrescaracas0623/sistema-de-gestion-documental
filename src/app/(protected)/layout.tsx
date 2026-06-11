import { redirect } from "next/navigation";

import { IpsAppShell } from "@/shared/components/ips-app-shell";
import { getSession } from "@/shared/lib/auth/get-session";
import { getUserDisplay } from "@/shared/lib/auth/user-display";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session === null) {
    redirect("/login");
    return null;
  }

  const { initials, displayName } = getUserDisplay(session.email, session.fullName);

  return (
    <IpsAppShell
      email={session.email}
      roleName={session.roleName}
      permissions={session.permissions}
      initials={initials}
      displayName={displayName}
    >
      {children}
    </IpsAppShell>
  );
}
