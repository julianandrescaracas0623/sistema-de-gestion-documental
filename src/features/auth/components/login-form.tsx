"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { loginAction, type LoginActionState } from "../actions/login.action";

import { Button } from "@/shared/components/ui/button";
import { FormField } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";

const schema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;

const initialState: LoginActionState = { status: "idle" };

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  const onSubmit = handleSubmit((data) => {
    const fd = new FormData();
    fd.set("email", data.email);
    fd.set("password", data.password);
    startTransition(() => { formAction(fd); });
  });

  return (
    <form onSubmit={(e) => { void onSubmit(e); }} data-testid="login-form" className="space-y-5">
      {state.status === "error" && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <FormField id="email" label="Correo electrónico" error={errors.email?.message}>
        {(field) => (
          <Input
            type="email"
            autoComplete="email"
            placeholder="usuario@ips.com"
            className="h-10 bg-background/70"
            {...field}
            {...register("email")}
          />
        )}
      </FormField>

      <FormField id="password" label="Contraseña" error={errors.password?.message}>
        {(field) => (
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-10 bg-background/70"
            {...field}
            {...register("password")}
          />
        )}
      </FormField>

      <Button type="submit" className="mt-1 h-10 w-full text-sm font-semibold" loading={isPending}>
        Iniciar sesión
      </Button>

      <p className="text-center text-sm">
        <Link href={"/forgot-password"} className="text-primary hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
      <p className="text-muted-foreground text-center text-xs leading-relaxed">
        Si no tienes acceso a tu correo, contacta al administrador del sistema para restablecer tu
        contraseña.
      </p>
    </form>
  );
}
