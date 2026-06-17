"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteCategoryAction } from "@/features/categories/actions/delete-category.action";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import type { CategoryAdminRow } from "@/features/categories/queries/categories.queries";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { TableRowActionsMenu } from "@/shared/components/table-row-actions-menu";

export function CategoryRowActions({ category }: { category: CategoryAdminRow }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", category.id);
      const result = await deleteCategoryAction(null, formData);

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
                setTimeout(() => {
                  setEditOpen(true);
                }, 0);
              },
            },
            {
              label: "Eliminar",
              icon: Trash2,
              destructive: true,
              onSelect: () => {
                setTimeout(() => {
                  setDeleteOpen(true);
                }, 0);
              },
            },
          ]}
        />
      </div>
      <CategoryForm
        mode="edit"
        category={{ id: category.id, name: category.name, description: category.description }}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => {
          router.refresh();
        }}
      />
      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar categoría"
        description={
          <>
            ¿Estás seguro que deseas eliminar la categoría <strong>{category.name}</strong>? Esta
            acción no se puede deshacer.
          </>
        }
        confirmLabel={isPending ? "Eliminando…" : "Eliminar"}
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
