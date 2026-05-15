import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateUserForm } from "@/features/user-admin/components/create-user-form";
import { getRoleForUser } from "@/shared/lib/auth/get-role-for-user";
import { createClient } from "@/shared/lib/supabase/server";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    redirect("/login");
  }

  const role = await getRoleForUser(supabase, user.id);
  if (role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-7 py-4">
        <p className="text-muted-foreground text-xs tracking-wide">
          Inicio <span className="opacity-50">/</span> Administración <span className="opacity-50">/</span> Usuarios
        </p>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Usuarios</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Alta de cuentas y asignación de roles. No hay registro público.
        </p>
      </header>
      <div className="mx-auto w-full max-w-lg flex-1 px-7 py-7">
        <Link
          href="/"
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        >
          ← Volver al inicio
        </Link>
        <div className="mt-6">
          <CreateUserForm />
        </div>
      </div>
    </div>
  );
}
