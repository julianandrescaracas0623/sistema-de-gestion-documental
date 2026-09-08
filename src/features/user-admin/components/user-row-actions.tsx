"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteUserByAdminAction } from "@/features/user-admin/actions/delete-user.action";
import { EditUserForm } from "@/features/user-admin/components/edit-user-form";
import type { RoleOption, UserAdminRow } from "@/features/user-admin/queries/users.queries";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { RowActions, type RowActionItem } from "@/shared/components/row-actions";

export function UserRowActions({
  user,
  roles,
  currentAdminId,
  canUpdate = true,
  canDelete = true,
}: {
  user: UserAdminRow;
  roles: RoleOption[];
  currentAdminId: string;
  canUpdate?: boolean;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (user.id === currentAdminId) {
    return <span className="text-muted-foreground text-xs">Tu cuenta</span>;
  }

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", user.id);
      const result = await deleteUserByAdminAction(null, formData);

      if (result.status === "error") {
        toast.error(result.message);
        setDeleteOpen(false);
        return;
      }

      toast.success(result.message);
      setDeleteOpen(false);
      router.refresh();
    });
  };

  const items: RowActionItem[] = [];
  if (canUpdate && roles.length > 0) {
    items.push({
      label: `Editar usuario ${user.email}`,
      icon: Pencil,
      onSelect: () => {
        setEditOpen(true);
      },
    });
  }
  if (canDelete) {
    items.push({
      label: `Eliminar usuario ${user.email}`,
      icon: Trash2,
      destructive: true,
      onSelect: () => {
        setDeleteOpen(true);
      },
    });
  }

  return (
    <>
      <RowActions items={items} />
      {canUpdate && roles.length > 0 ? (
        <EditUserForm
          user={user}
          roles={roles}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={() => {
            router.refresh();
          }}
        />
      ) : null}
      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar usuario"
        description={
          <>
            ¿Eliminar la cuenta <strong>{user.email}</strong>? El usuario perderá acceso al sistema.
            Sus documentos permanecerán en el repositorio.
          </>
        }
        confirmLabel={isPending ? "Eliminando…" : "Eliminar usuario"}
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
