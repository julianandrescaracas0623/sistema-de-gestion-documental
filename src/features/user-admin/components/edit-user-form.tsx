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

          <div className="space-y-2">
            <Label htmlFor={`edit-user-name-${user.id}`}>
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`edit-user-name-${user.id}`}
              name="fullName"
              required
              minLength={2}
              maxLength={120}
              disabled={isPending}
              defaultValue={user.fullName}
            />
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
