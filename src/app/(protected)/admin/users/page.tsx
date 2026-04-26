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

  const role = await getRoleForUser(user.id);
  if (role !== "admin") {
    redirect("/");
  }

  return (
    <main className="container mx-auto max-w-lg p-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          ← Volver al inicio
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alta de cuentas y asignación de roles. No hay registro público.
        </p>
      </div>
      <CreateUserForm />
    </main>
  );
}
