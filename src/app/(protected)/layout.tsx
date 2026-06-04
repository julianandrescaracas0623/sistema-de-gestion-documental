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

  const { initials, displayName } = getUserDisplay(session.email, null);

  return (
    <IpsAppShell email={session.email} role={session.role} initials={initials} displayName={displayName}>
      {children}
    </IpsAppShell>
  );
}
