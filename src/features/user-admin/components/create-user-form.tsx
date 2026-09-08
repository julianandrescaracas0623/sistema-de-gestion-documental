"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  createUserByAdminAction,
  type CreateUserActionState,
} from "../actions/create-user.action";
import type { RoleOption } from "../queries/users.queries";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { FormField } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";

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

export function CreateUserForm({
  roles,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: {
  roles: RoleOption[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const defaultRoleId = roles.find((r) => r.slug === "user")?.id ?? roles[0]?.id ?? "";

  const [state, formAction] = useActionState(createUserByAdminAction, initialState);
  const [isPending, startTransition] = useTransition();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) controlledOnOpenChange?.(value);
    else setInternalOpen(value);
  };
  const onSuccessRef = useRef(onSuccess);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { roleId: defaultRoleId },
  });

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (state.status === "error") toast.error(state.message);
    if (state.status === "success") {
      toast.success("Usuario creado correctamente");
      reset({ roleId: defaultRoleId });
      setOpen(false);
      onSuccessRef.current?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            Asigna el rol y comunica la contraseña inicial por un canal seguro acordado con la IPS.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void onSubmit(e);
          }}
          data-testid="create-user-form"
          className="space-y-4"
        >
          {state.status === "error" && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          )}

          <FormField id="new-full-name" label="Nombre completo" required error={errors.fullName?.message}>
            {(field) => <Input type="text" autoComplete="off" {...field} {...register("fullName")} />}
          </FormField>

          <FormField id="new-email" label="Correo electrónico" required error={errors.email?.message}>
            {(field) => <Input type="email" autoComplete="off" {...field} {...register("email")} />}
          </FormField>

          <FormField id="new-password" label="Contraseña inicial" required error={errors.password?.message}>
            {(field) => (
              <Input type="password" autoComplete="new-password" {...field} {...register("password")} />
            )}
          </FormField>

          <FormField id="new-role" label="Rol" required error={errors.roleId?.message}>
            {(field) => (
              <Select {...field} {...register("roleId")}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <DialogFooter>
            <Button type="submit" className="w-full sm:w-auto" loading={isPending}>
              Crear usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
