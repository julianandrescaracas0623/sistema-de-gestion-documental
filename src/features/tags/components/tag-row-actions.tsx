"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteTagAction } from "@/features/tags/actions/delete-tag.action";
import { TagForm } from "@/features/tags/components/TagForm";
import type { TagAdminRow } from "@/features/tags/queries/tags.queries";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { RowActions, type RowActionItem } from "@/shared/components/row-actions";

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
      <TagForm
        mode="edit"
        tag={{ id: tag.id, name: tag.name }}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => {
          router.refresh();
        }}
      />
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
