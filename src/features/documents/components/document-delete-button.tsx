"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { softDeleteDocumentAction } from "@/features/documents/actions/soft-delete-document.action";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { Button } from "@/shared/components/ui/button";

export function DocumentDeleteButton({
  documentId,
  title,
}: {
  documentId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("documentId", documentId);
      const result = await softDeleteDocumentAction(null, formData);

      if (result.status === "error") {
        toast.error(result.message);
        setOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() => {
          setOpen(true);
        }}
      >
        Eliminar
      </Button>
      <ConfirmDestructiveDialog
        open={open}
        onOpenChange={setOpen}
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
