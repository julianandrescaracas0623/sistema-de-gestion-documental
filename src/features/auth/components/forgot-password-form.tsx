"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { requestPasswordResetAction } from "@/features/auth/actions/request-password-reset.action";
import { Button } from "@/shared/components/ui/button";
import { FormField } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";

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
      <FormField id="email" label="Correo electrónico" error={errors.email?.message}>
        {(field) => (
          <Input
            type="email"
            autoComplete="email"
            placeholder="usuario@ips.com"
            {...field}
            {...register("email")}
          />
        )}
      </FormField>
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
