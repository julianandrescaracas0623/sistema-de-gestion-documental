"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  createUserByAdminAction,
  type CreateUserActionState,
} from "../actions/create-user.action";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ROLE_NAMES } from "@/shared/db/user_roles.schema";

const schema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(ROLE_NAMES),
});

type FormValues = z.infer<typeof schema>;

const initialState: CreateUserActionState = { status: "idle" };

const roleLabels: Record<(typeof ROLE_NAMES)[number], string> = {
  admin: "Administrador",
  user: "Usuario administrativo",
};

export function CreateUserForm() {
  const [state, formAction] = useActionState(createUserByAdminAction, initialState);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "user" },
  });

  useEffect(() => {
    if (state.status === "error") toast.error(state.message);
    if (state.status === "success") toast.success("Usuario creado correctamente");
  }, [state]);

  const onSubmit = handleSubmit((data) => {
    const fd = new FormData();
    fd.set("email", data.email);
    fd.set("password", data.password);
    fd.set("role", data.role);
    startTransition(() => {
      formAction(fd);
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo usuario</CardTitle>
        <CardDescription>
          Solo los administradores pueden dar de alta cuentas. Asigna el rol y comunica la contraseña
          inicial por un canal seguro acordado con la IPS.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { void onSubmit(e); }} data-testid="create-user-form" className="space-y-4">
          {state.status === "error" && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="new-email">Correo electrónico</Label>
            <Input id="new-email" type="email" autoComplete="off" {...register("email")} />
            {errors.email !== undefined && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password">Contraseña inicial</Label>
            <Input id="new-password" type="password" autoComplete="new-password" {...register("password")} />
            {errors.password !== undefined && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-role">Rol</Label>
            <select
              id="new-role"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              {...register("role")}
            >
              {ROLE_NAMES.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
            {errors.role !== undefined && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={isPending}>
            Crear usuario
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
