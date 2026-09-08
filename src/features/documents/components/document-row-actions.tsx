"use client";

import { Eye, Trash2 } from "lucide-react";
import type { Route } from "next";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { softDeleteDocumentAction } from "@/features/documents/actions/soft-delete-document.action";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { RowActions, type RowActionItem } from "@/shared/components/row-actions";

export function DocumentRowActions({
  documentId,
  title,
  canDelete = true,
}: {
  documentId: string;
  title: string;
  canDelete?: boolean;
}) {
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

  const items: RowActionItem[] = [
    {
      label: `Ver ${title}`,
      icon: Eye,
      href: `/documents/${documentId}` as Route,
    },
  ];
  if (canDelete) {
    items.push({
      label: `Eliminar ${title}`,
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
