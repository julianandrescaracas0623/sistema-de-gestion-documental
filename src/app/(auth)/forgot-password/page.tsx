import { Suspense } from "react";

import { ForgotPasswordErrorNotice } from "@/features/auth/components/forgot-password-error-notice";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-sidebar px-4 py-10">
      <div className="relative z-[1] w-full max-w-[380px]">
        <Card className="rounded-2xl border-0 py-2 shadow-[0_24px_64px_rgb(0_0_0/0.28)]">
          <CardHeader className="space-y-2 px-9 pt-10 pb-2">
            <CardTitle className="text-lg font-semibold">Recuperar contraseña</CardTitle>
            <CardDescription>
              Te enviaremos un enlace a tu correo institucional para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-9 pb-10">
            <Suspense fallback={null}>
              <ForgotPasswordErrorNotice />
            </Suspense>
            <ForgotPasswordForm />
            <p className="text-muted-foreground mt-6 text-xs leading-relaxed">
              Si no tienes acceso a tu correo, contacta al administrador del sistema para
              restablecer tu contraseña.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
