"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { purgeDocumentAction } from "@/features/documents/actions/purge-document.action";
import { restoreDocumentAction } from "@/features/documents/actions/restore-document.action";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { Button } from "@/shared/components/ui/button";

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

  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" disabled={isPending} onClick={restore}>
        <RotateCcw className="size-3.5" />
        Restaurar
      </Button>
      {canPurge ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={isPending}
            onClick={() => {
              setPurgeOpen(true);
            }}
          >
            <Trash2 className="size-3.5" />
            Eliminar
          </Button>
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
      ) : null}
    </div>
  );
}
