"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteTagAction } from "@/features/tags/actions/delete-tag.action";
import { updateTagAction } from "@/features/tags/actions/update-tag.action";
import type { TagAdminRow } from "@/features/tags/queries/tags.queries";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { RowActions, type RowActionItem } from "@/shared/components/row-actions";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

function EditTagDialog({
  tag,
  open,
  onOpenChange,
}: {
  tag: TagAdminRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(updateTagAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state === null) return;
    if (state.status === "error") {
      toast.error(state.message);
    } else {
      toast.success(state.message);
      onOpenChange(false);
      router.refresh();
    }
  }, [state, router, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar etiqueta</DialogTitle>
          <DialogDescription>Modifica el nombre y guarda los cambios.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={tag.id} />
          <div className="space-y-2">
            <Label htmlFor={`edit-tag-name-${tag.id}`}>
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`edit-tag-name-${tag.id}`}
              name="name"
              required
              maxLength={120}
              disabled={isPending}
              defaultValue={tag.name}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TagRowActions({
  tag,
  canUpdate = true,
  canDelete = true,
}: {
  tag: TagAdminRow;
  canUpdate?: boolean;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", tag.id);
      const result = await deleteTagAction(null, fd);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setDeleteOpen(false);
      router.refresh();
    });
  };

  const items: RowActionItem[] = [];
  if (canUpdate) {
    items.push({
      label: `Editar etiqueta ${tag.name}`,
      icon: Pencil,
      onSelect: () => {
        setEditOpen(true);
      },
    });
  }
  if (canDelete) {
    items.push({
      label: `Eliminar etiqueta ${tag.name}`,
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
      <EditTagDialog tag={tag} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar etiqueta"
        description={
          <>
            ¿Estás seguro que deseas eliminar la etiqueta <strong>{tag.name}</strong>? Se
            desvinculará de todos los documentos.
          </>
        }
        confirmLabel={isPending ? "Eliminando…" : "Eliminar"}
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
