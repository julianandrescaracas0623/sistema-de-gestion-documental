"use client";

import { Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { softDeleteDocumentAction } from "@/features/documents/actions/soft-delete-document.action";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { TableRowActionsMenu } from "@/shared/components/table-row-actions-menu";

export function DocumentRowActions({
  documentId,
  title,
}: {
  documentId: string;
  title: string;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("documentId", documentId);
      const result = await softDeleteDocumentAction(null, formData);

      if (result.status === "error") {
        toast.error(result.message);
        setDeleteOpen(false);
      }
    });
  };

  return (
    <>
      <TableRowActionsMenu
        items={[
          {
            label: "Ver",
            icon: Eye,
            onSelect: () => {
              router.push(`/documents/${documentId}`);
            },
          },
          {
            label: "Eliminar",
            icon: Trash2,
            destructive: true,
            onSelect: () => {
              setDeleteOpen(true);
            },
          },
        ]}
      />
      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar documento"
        description={
          <>
            ¿Estás seguro que deseas eliminar <strong>{title}</strong>? Esta acción no se puede
            deshacer desde la aplicación.
          </>
        }
        confirmLabel={isPending ? "Eliminando…" : "Eliminar"}
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
