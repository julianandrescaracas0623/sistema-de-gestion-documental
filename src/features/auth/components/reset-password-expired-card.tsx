import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export function ResetPasswordExpiredCard() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-sidebar px-4 py-10">
      <div className="relative z-[1] w-full max-w-[380px]">
        <Card className="rounded-2xl border-0 py-2 shadow-[0_24px_64px_rgb(0_0_0/0.28)]">
          <CardHeader className="space-y-2 px-9 pt-10 pb-2">
            <CardTitle className="text-lg font-semibold">Enlace no válido</CardTitle>
            <CardDescription>
              El enlace de recuperación expiró, ya fue usado o no se pudo establecer la sesión.
              Solicita uno nuevo para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-9 pb-10">
            <Button asChild className="w-full">
              <Link href={"/forgot-password"}>Solicitar nuevo enlace</Link>
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              <Link href="/login" className="text-primary hover:underline">
                Volver al inicio de sesión
              </Link>
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Si no tienes acceso a tu correo, contacta al administrador del sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
