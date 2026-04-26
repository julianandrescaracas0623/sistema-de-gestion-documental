import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/features/auth/actions/logout.action";
import { Button } from "@/shared/components/ui/button";
import { getRoleForUser } from "@/shared/lib/auth/get-role-for-user";
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

  const role = await getRoleForUser(user.id);
  const email = user.email ?? "usuario@ips.com";

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-card/95 shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <ShieldCheck className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight text-primary">IPS</p>
                <p className="text-xs text-muted-foreground">Gestión Documental</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground md:inline">{email}</span>
              <form action={logoutAction}>
                <Button type="submit" variant="destructive" className="gap-2">
                  <LogOut className="size-4" />
                  Cerrar sesión
                </Button>
              </form>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Inicio</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/documents">Documentos</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/documents/new">Subir</Link>
            </Button>
            {role === "admin" && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/users">Usuarios</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
