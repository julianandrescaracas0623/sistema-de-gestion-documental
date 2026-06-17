"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { requestPasswordResetAction } from "@/features/auth/actions/request-password-reset.action";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const schema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (state === null) return;
    if (state.status === "error") toast.error(state.message);
    else toast.success(state.message);
  }, [state]);

  const onSubmit = handleSubmit((data) => {
    const fd = new FormData();
    fd.set("email", data.email);
    startTransition(() => {
      formAction(fd);
    });
  });

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e);
      }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="usuario@ips.com"
          {...register("email")}
        />
        {errors.email !== undefined ? (
          <p className="text-destructive text-sm">{errors.email.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" loading={isPending}>
        Enviar enlace de recuperación
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </form>
  );
}
