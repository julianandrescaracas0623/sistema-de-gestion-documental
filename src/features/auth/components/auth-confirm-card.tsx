"use client";

import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

function AuthConfirmContent() {
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/reset-password";

  if (tokenHash === null || tokenHash === "" || type === null || type === "") {
    return (
      <Card className="rounded-2xl border-0 py-2 shadow-[0_24px_64px_rgb(0_0_0/0.28)]">
        <CardHeader className="space-y-2 px-9 pt-10 pb-2">
          <CardTitle className="text-lg font-semibold">Enlace no válido</CardTitle>
          <CardDescription>
            El enlace de confirmación está incompleto o no es válido.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-9 pb-10">
          <Button asChild className="w-full">
            <Link href="/forgot-password">Solicitar nuevo enlace</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const callbackUrl = `/api/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(next)}`;

  return (
    <Card className="rounded-2xl border-0 py-2 shadow-[0_24px_64px_rgb(0_0_0/0.28)]">
      <CardHeader className="space-y-2 px-9 pt-10 pb-2">
        <CardTitle className="text-lg font-semibold">Confirmar acción</CardTitle>
        <CardDescription>
          {type === "recovery"
            ? "Haz clic en el botón para continuar con el restablecimiento de tu contraseña."
            : "Haz clic en el botón para continuar."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-9 pb-10">
        <Button asChild className="w-full">
          <Link href={callbackUrl as Route}>Continuar</Link>
        </Button>
        <p className="text-muted-foreground text-center text-xs leading-relaxed">
          Este paso evita que el enlace se consuma automáticamente al abrir el correo.
        </p>
      </CardContent>
    </Card>
  );
}

export function AuthConfirmCard() {
  return (
    <Suspense
      fallback={
        <p className="text-muted-foreground text-sm">Cargando confirmación…</p>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}
