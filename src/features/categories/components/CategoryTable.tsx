"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteCategoryAction } from "@/features/categories/actions/delete-category.action";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import type { CategoryAdminRow } from "@/features/categories/queries/categories.queries";
import { LocalDate } from "@/shared/components/local-date";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";

function DeleteCategoryButton({ category }: { category: CategoryAdminRow }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", category.id);
      const result = await deleteCategoryAction(null, formData);

      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        setOpen(false);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => { setOpen(true); }}
      >
        Eliminar
      </Button>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Eliminar categoría</SheetTitle>
          <SheetDescription>
            ¿Estás seguro que deseas eliminar la categoría "{category.name}"? Esta acción no se puede
            deshacer.
          </SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 pt-6">
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? "Eliminando…" : "Confirmar"}
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

export function CategoryTable({ rows }: { rows: CategoryAdminRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm font-medium text-foreground">No hay categorías</p>
        <p className="mt-1 text-sm text-muted-foreground">Crea la primera categoría con el botón superior.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Nombre
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Descripción
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-center text-[11.5px] font-semibold tracking-wide uppercase">
              Documentos
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Creador
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Creada
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-right text-[11.5px] font-semibold tracking-wide uppercase">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-border hover:bg-muted/50 border-b transition-colors last:border-b-0"
            >
              <td className="px-6 py-4 font-medium">{row.name}</td>
              <td className="px-6 py-4 text-muted-foreground">
                {row.description ?? <span className="opacity-40">—</span>}
              </td>
              <td className="px-6 py-4 text-center">
                <Badge variant={row.doc_count > 0 ? "default" : "secondary"}>
                  {String(row.doc_count)}
                </Badge>
              </td>
              <td className="px-6 py-4 text-muted-foreground text-xs">
                {row.created_by_email ?? <span className="opacity-40">—</span>}
              </td>
              <td className="px-6 py-4 text-muted-foreground">
                <LocalDate date={row.created_at} />
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-end gap-1">
                  <CategoryForm
                    mode="edit"
                    category={{ id: row.id, name: row.name, description: row.description }}
                    trigger={
                      <Button size="sm" variant="ghost">
                        Editar
                      </Button>
                    }
                  />
                  <DeleteCategoryButton category={row} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
