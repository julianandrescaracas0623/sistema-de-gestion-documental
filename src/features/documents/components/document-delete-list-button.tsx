"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { softDeleteDocumentAction } from "@/features/documents/actions/soft-delete-document.action";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";

export function DocumentDeleteListButton({ documentId, title }: { documentId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("documentId", documentId);
      const result = await softDeleteDocumentAction(null, formData);

      if (result.status === "error") {
        toast.error(result.message);
      } else {
        setOpen(false);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setOpen(true);
        }}
      >
        Eliminar
      </Button>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Eliminar documento</SheetTitle>
          <SheetDescription>
            ¿Estás seguro que deseas eliminar "{title}"? Esta acción no se puede deshacer desde la app.
          </SheetDescription>
        </SheetHeader>
        <div className="flex gap-3 pt-6">
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? "Eliminando…" : "Eliminar"}
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Cancelar
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
