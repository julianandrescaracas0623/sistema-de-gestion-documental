"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateOwnProfileAction } from "@/features/user-profile/actions/update-profile.action";
import type { OwnProfileRow } from "@/features/user-profile/queries/profile.queries";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { FormField } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { ActionResult } from "@/shared/lib/action-result";

const schema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(60, "El nombre es demasiado largo"),
  lastName: z
    .string()
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(60, "El apellido es demasiado largo"),
  documentNumber: z
    .string()
    .trim()
    .min(4, "El número de documento debe tener al menos 4 caracteres")
    .max(20, "El número de documento es demasiado largo"),
  phone: z
    .string()
    .trim()
    .min(7, "El teléfono debe tener al menos 7 caracteres")
    .max(20, "El teléfono es demasiado largo"),
});

type FormValues = z.infer<typeof schema>;

const idleState = { status: "idle" } as unknown as ActionResult;

export function ProfileForm({ profile }: { profile: OwnProfileRow }) {
  const [state, formAction] = useActionState(updateOwnProfileAction, idleState);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      documentNumber: profile.documentNumber ?? "",
      phone: profile.phone ?? "",
    },
  });

  useEffect(() => {
    if (state.status === "error") toast.error(state.message);
    if (state.status === "success") toast.success(state.message);
  }, [state]);

  const onSubmit = handleSubmit((data) => {
    const fd = new FormData();
    fd.set("firstName", data.firstName);
    fd.set("lastName", data.lastName);
    fd.set("documentNumber", data.documentNumber);
    fd.set("phone", data.phone);
    startTransition(() => {
      formAction(fd);
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Mis datos</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            void onSubmit(e);
          }}
          data-testid="profile-form"
          className="space-y-4"
        >
          {state.status === "error" ? (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="profile-email">Correo electrónico</Label>
            <Input id="profile-email" type="email" value={profile.email} disabled readOnly />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField id="profile-first-name" label="Nombres" required error={errors.firstName?.message}>
              {(field) => <Input type="text" autoComplete="off" {...field} {...register("firstName")} />}
            </FormField>
            <FormField id="profile-last-name" label="Apellidos" required error={errors.lastName?.message}>
              {(field) => <Input type="text" autoComplete="off" {...field} {...register("lastName")} />}
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="profile-document-number"
              label="Número de documento"
              required
              error={errors.documentNumber?.message}
            >
              {(field) => (
                <Input type="text" autoComplete="off" {...field} {...register("documentNumber")} />
              )}
            </FormField>
            <FormField id="profile-phone" label="Teléfono" required error={errors.phone?.message}>
              {(field) => <Input type="tel" autoComplete="off" {...field} {...register("phone")} />}
            </FormField>
          </div>

          <Button type="submit" loading={isPending}>
            Guardar cambios
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
