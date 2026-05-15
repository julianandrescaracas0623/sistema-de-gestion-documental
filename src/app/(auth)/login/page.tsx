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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-sidebar px-4 py-10">
      <div
        className="pointer-events-none absolute h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(11_143_201/0.18),transparent_70%)]"
        style={{ left: "15%", top: "20%" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute h-[360px] w-[360px] translate-x-1/2 translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(11_143_201/0.12),transparent_70%)]"
        style={{ right: "10%", bottom: "15%" }}
        aria-hidden
      />

      <div className="relative z-[1] w-full max-w-[380px]">
        <Card className="rounded-2xl border-0 py-2 shadow-[0_24px_64px_rgb(0_0_0/0.28)]">
          <CardHeader className="space-y-5 px-9 pt-10 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[10px] bg-primary text-[15px] font-extrabold text-primary-foreground">
                IPS
              </div>
              <div className="space-y-0.5 text-left">
                <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
                  Sistema IPS
                </p>
                <CardTitle className="text-[22px] font-bold tracking-tight text-foreground">
                  Gestión Documental
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-left text-[13px] leading-relaxed">
              Accede con tu cuenta institucional para gestionar documentos de forma segura.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-9 pb-10">
            <div className="space-y-1 text-center">
              <h2 className="text-lg font-semibold">Bienvenido de nuevo</h2>
              <p className="text-muted-foreground text-sm">
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
