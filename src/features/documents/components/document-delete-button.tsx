"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { softDeleteDocumentAction } from "@/features/documents/actions/soft-delete-document.action";
import { Button } from "@/shared/components/ui/button";

function isActionResult(v: unknown): v is { status: "success" | "error"; message: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    "status" in v &&
    (v as { status: string }).status !== "idle" &&
    "message" in v
  );
}

export function DocumentDeleteButton({ documentId }: { documentId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [state, formAction, isPending] = useActionState(softDeleteDocumentAction, null);

  useEffect(() => {
    if (state === null || !isActionResult(state)) {
      return;
    }
    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  if (!confirm) {
    return (
      <Button
        type="button"
        variant="destructive"
        onClick={() => {
          setConfirm(true);
        }}
      >
        Eliminar documento
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="documentId" value={documentId} />
      <span className="text-sm text-muted-foreground">¿Seguro? Esta acción no se puede deshacer desde la app.</span>
      <Button type="submit" variant="destructive" disabled={isPending}>
        {isPending ? "Eliminando…" : "Confirmar eliminación"}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          setConfirm(false);
        }}
      >
        Cancelar
      </Button>
    </form>
  );
}
