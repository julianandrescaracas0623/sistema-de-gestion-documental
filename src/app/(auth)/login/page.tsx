import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/features/auth/components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary/15 via-background to-accent/10" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),_transparent_55%)]" />

      <div className="relative w-full max-w-md">
        <Card className="border-border/80 bg-card/95 shadow-xl backdrop-blur-sm">
          <CardHeader className="space-y-5 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="size-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Sistema IPS
              </p>
              <CardTitle className="text-3xl font-bold tracking-tight text-primary">
                Gestión Documental
              </CardTitle>
            </div>
            <CardDescription className="text-sm leading-relaxed">
              Accede con tu cuenta institucional para gestionar documentos de forma segura.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-1 text-center">
              <h2 className="text-lg font-semibold">Bienvenido de nuevo</h2>
              <p className="text-sm text-muted-foreground">
                Si aún no tienes usuario, solicita el alta con un administrador.
              </p>
            </div>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
