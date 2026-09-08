"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { purgeDocumentAction } from "@/features/documents/actions/purge-document.action";
import { restoreDocumentAction } from "@/features/documents/actions/restore-document.action";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { RowActions, type RowActionItem } from "@/shared/components/row-actions";

export function TrashRowActions({
  documentId,
  title,
  canPurge,
}: {
  documentId: string;
  title: string;
  canPurge: boolean;
}) {
  const router = useRouter();
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const run = (fd: FormData, action: typeof restoreDocumentAction) => {
    startTransition(async () => {
      const result = await action(null, fd);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setPurgeOpen(false);
      router.refresh();
    });
  };

  const restore = () => {
    const fd = new FormData();
    fd.set("documentId", documentId);
    run(fd, restoreDocumentAction);
  };

  const purge = () => {
    const fd = new FormData();
    fd.set("documentId", documentId);
    run(fd, purgeDocumentAction);
  };

  const items: RowActionItem[] = [
    {
      label: `Restaurar ${title}`,
      icon: RotateCcw,
      onSelect: restore,
      disabled: isPending,
    },
  ];
  if (canPurge) {
    items.push({
      label: `Eliminar permanentemente ${title}`,
      icon: Trash2,
      destructive: true,
      disabled: isPending,
      onSelect: () => {
        setPurgeOpen(true);
      },
    });
  }

  return (
    <>
      <RowActions items={items} />
      <ConfirmDestructiveDialog
        open={purgeOpen}
        onOpenChange={setPurgeOpen}
        title="Eliminar permanentemente"
        description={
          <>
            ¿Eliminar <strong>{title}</strong> de forma permanente? Se borra el registro y el
            archivo. Esta acción no se puede deshacer.
          </>
        }
        confirmLabel={isPending ? "Eliminando…" : "Eliminar permanentemente"}
        isPending={isPending}
        onConfirm={purge}
      />
    </>
  );
}
