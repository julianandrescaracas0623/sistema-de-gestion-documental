"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteTagAction } from "@/features/tags/actions/delete-tag.action";
import { updateTagAction } from "@/features/tags/actions/update-tag.action";
import type { TagAdminRow } from "@/features/tags/queries/tags.queries";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { TableRowActionsMenu } from "@/shared/components/table-row-actions-menu";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";

function EditTagSheet({ tag, open, onOpenChange }: { tag: TagAdminRow; open: boolean; onOpenChange: (open: boolean) => void }) {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Editar etiqueta</SheetTitle>
          <SheetDescription>Modifica el nombre y guarda los cambios.</SheetDescription>
        </SheetHeader>
        <form ref={formRef} action={formAction} className="mt-6 space-y-4 px-1">
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
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function TagRowActions({ tag }: { tag: TagAdminRow }) {
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

  return (
    <>
      <div className="flex justify-end">
        <TableRowActionsMenu
          items={[
            {
              label: "Editar",
              icon: Pencil,
              onSelect: () => {
                setEditOpen(true);
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
      </div>
      <EditTagSheet tag={tag} open={editOpen} onOpenChange={setEditOpen} />
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
