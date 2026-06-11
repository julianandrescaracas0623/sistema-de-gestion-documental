"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteUserByAdminAction } from "@/features/user-admin/actions/delete-user.action";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { TableRowActionsMenu } from "@/shared/components/table-row-actions-menu";

export function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", userId);
      const result = await deleteUserByAdminAction(null, formData);

      if (result.status === "error") {
        toast.error(result.message);
        setOpen(false);
        return;
      }

      toast.success(result.message);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <TableRowActionsMenu
        items={[
          {
            label: "Eliminar",
            icon: Trash2,
            destructive: true,
            onSelect: () => {
              setOpen(true);
            },
          },
        ]}
      />
      <ConfirmDestructiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Eliminar usuario"
        description={
          <>
            ¿Eliminar la cuenta <strong>{email}</strong>? El usuario perderá acceso al sistema. Sus
            documentos permanecerán en el repositorio.
          </>
        }
        confirmLabel={isPending ? "Eliminando…" : "Eliminar usuario"}
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
