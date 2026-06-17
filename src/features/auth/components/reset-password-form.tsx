"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { resetPasswordAction } from "@/features/auth/actions/reset-password.action";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const schema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirma tu contraseña"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (state === null) return;
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  const onSubmit = handleSubmit((data) => {
    const fd = new FormData();
    fd.set("password", data.password);
    fd.set("confirmPassword", data.confirmPassword);
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
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password !== undefined ? (
          <p className="text-destructive text-sm">{errors.password.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword !== undefined ? (
          <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" loading={isPending}>
        Guardar nueva contraseña
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        <Link href={"/forgot-password"} className="text-primary hover:underline">
          Solicitar un nuevo enlace
        </Link>
      </p>
    </form>
  );
}
