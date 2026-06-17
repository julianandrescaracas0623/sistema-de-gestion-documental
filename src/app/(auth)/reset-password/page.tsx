import { redirect } from "next/navigation";

import { ResetPasswordExpiredCard } from "@/features/auth/components/reset-password-expired-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { createClient } from "@/shared/lib/supabase/server";

interface ResetPasswordPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { code } = await searchParams;

  if (code !== undefined && code !== "") {
    redirect(
      `/api/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent("/reset-password")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return <ResetPasswordExpiredCard />;
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-sidebar px-4 py-10">
      <div className="relative z-[1] w-full max-w-[380px]">
        <Card className="rounded-2xl border-0 py-2 shadow-[0_24px_64px_rgb(0_0_0/0.28)]">
          <CardHeader className="space-y-2 px-9 pt-10 pb-2">
            <CardTitle className="text-lg font-semibold">Nueva contraseña</CardTitle>
            <CardDescription>Ingresa y confirma tu nueva contraseña.</CardDescription>
          </CardHeader>
          <CardContent className="px-9 pb-10">
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
