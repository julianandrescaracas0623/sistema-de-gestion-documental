"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { updateUserByAdminAction } from "@/features/user-admin/actions/update-user.action";
import type { RoleOption, UserAdminRow } from "@/features/user-admin/queries/users.queries";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";

export function EditUserForm({
  user,
  roles,
  open,
  onOpenChange,
  onSuccess,
}: {
  user: UserAdminRow;
  roles: RoleOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateUserByAdminAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (state === null) return;
    if (state.status === "error") {
      toast.error(state.message);
    } else {
      toast.success(state.message);
      onOpenChange(false);
      onSuccessRef.current?.();
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>
            Actualiza el nombre y el rol de <strong>{user.email}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="userId" value={user.id} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`edit-user-first-name-${user.id}`}>
                Nombres <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`edit-user-first-name-${user.id}`}
                name="firstName"
                required
                minLength={2}
                maxLength={60}
                disabled={isPending}
                defaultValue={user.firstName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-user-last-name-${user.id}`}>
                Apellidos <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`edit-user-last-name-${user.id}`}
                name="lastName"
                required
                minLength={2}
                maxLength={60}
                disabled={isPending}
                defaultValue={user.lastName}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`edit-user-document-${user.id}`}>
                Número de documento <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`edit-user-document-${user.id}`}
                name="documentNumber"
                required
                minLength={4}
                maxLength={20}
                disabled={isPending}
                defaultValue={user.documentNumber ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-user-phone-${user.id}`}>
                Teléfono <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`edit-user-phone-${user.id}`}
                name="phone"
                type="tel"
                required
                minLength={7}
                maxLength={20}
                disabled={isPending}
                defaultValue={user.phone ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-user-role-${user.id}`}>
              Rol <span className="text-destructive">*</span>
            </Label>
            <Select
              id={`edit-user-role-${user.id}`}
              name="roleId"
              required
              disabled={isPending}
              defaultValue={user.roleId}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
