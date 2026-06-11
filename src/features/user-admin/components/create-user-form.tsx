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
import type { RoleOption } from "../queries/users.queries";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre es demasiado largo"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  roleId: z.string().uuid("Selecciona un rol válido"),
});

type FormValues = z.infer<typeof schema>;

const initialState: CreateUserActionState = { status: "idle" };

export function CreateUserForm({ roles }: { roles: RoleOption[] }) {
  const defaultRoleId = roles.find((r) => r.slug === "user")?.id ?? roles[0]?.id ?? "";

  const [state, formAction] = useActionState(createUserByAdminAction, initialState);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { roleId: defaultRoleId },
  });

  useEffect(() => {
    if (state.status === "error") toast.error(state.message);
    if (state.status === "success") toast.success("Usuario creado correctamente");
  }, [state]);

  const onSubmit = handleSubmit((data) => {
    const fd = new FormData();
    fd.set("fullName", data.fullName);
    fd.set("email", data.email);
    fd.set("password", data.password);
    fd.set("roleId", data.roleId);
    startTransition(() => {
      formAction(fd);
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo usuario</CardTitle>
        <CardDescription>
          Solo quienes gestionan usuarios pueden dar de alta cuentas. Asigna el rol y comunica la contraseña
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
            <Label htmlFor="new-full-name">Nombre completo</Label>
            <Input id="new-full-name" type="text" autoComplete="off" {...register("fullName")} />
            {errors.fullName !== undefined && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

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
              {...register("roleId")}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.roleId !== undefined && (
              <p className="text-sm text-destructive">{errors.roleId.message}</p>
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
