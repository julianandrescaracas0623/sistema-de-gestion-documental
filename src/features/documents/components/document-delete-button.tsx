"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { softDeleteDocumentAction } from "@/features/documents/actions/soft-delete-document.action";
import { Button } from "@/shared/components/ui/button";

export function DocumentDeleteButton({ documentId }: { documentId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("documentId", documentId);
      const result = await softDeleteDocumentAction(null, formData);

      if (result.status === "error") {
        toast.error(result.message);
        setShowConfirm(false);
      }
    });
  };

  if (!showConfirm) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() => {
          setShowConfirm(true);
        }}
      >
        Eliminar
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">¿Seguro?</span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={handleDelete}
      >
        {isPending ? "Eliminando…" : "Confirmar"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          setShowConfirm(false);
        }}
      >
        Cancelar
      </Button>
    </div>
  );
}
