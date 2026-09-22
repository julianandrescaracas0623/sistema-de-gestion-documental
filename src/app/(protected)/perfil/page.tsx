import { redirect } from "next/navigation";

import { ProfileForm } from "@/features/user-profile/components/profile-form";
import { getOwnProfile } from "@/features/user-profile/queries/profile.queries";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import { getSession } from "@/shared/lib/auth/get-session";
import { createClient } from "@/shared/lib/supabase/server";

export default async function ProfilePage() {
  const session = await getSession();
  if (session === null) redirect("/login");

  const supabase = await createClient();
  const { data: profile, error } = await getOwnProfile(supabase, session.userId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <PageBreadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Mi perfil" }]} />
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Mi perfil</h1>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        {error !== null || profile === null ? (
          <p className="text-destructive" role="alert">
            No se pudo cargar tu perfil{error !== null ? `: ${error.message}` : "."}
          </p>
        ) : (
          <ProfileForm profile={profile} />
        )}
      </div>
    </div>
  );
}
