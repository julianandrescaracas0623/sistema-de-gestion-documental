"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createCategoryAction } from "@/features/categories/actions/create-category.action";
import { updateCategoryAction } from "@/features/categories/actions/update-category.action";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";

interface CategoryFormProps {
  mode: "create" | "edit";
  category?: { id: string; name: string; description: string | null };
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function CategoryForm({ mode, category, trigger, onSuccess }: CategoryFormProps) {
  const action = mode === "create" ? createCategoryAction : updateCategoryAction;
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (state === null) return;
    if (state.status === "error") {
      toast.error(state.message);
    } else {
      toast.success(state.message);
      formRef.current?.reset();
      setOpen(false);
      onSuccessRef.current?.();
    }
  }, [state]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Nueva categoría" : "Editar categoría"}</SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Completa los campos para crear una nueva categoría."
              : "Modifica los campos y guarda los cambios."}
          </SheetDescription>
        </SheetHeader>

        <form ref={formRef} action={formAction} className="mt-6 space-y-4 px-1">
          {mode === "edit" && category !== undefined ? (
            <input type="hidden" name="id" value={category.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="cat-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cat-name"
              name="name"
              required
              maxLength={120}
              disabled={isPending}
              defaultValue={mode === "edit" ? (category?.name ?? "") : ""}
              placeholder="Ej. Órdenes médicas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-description">Descripción</Label>
            <Input
              id="cat-description"
              name="description"
              maxLength={500}
              disabled={isPending}
              defaultValue={mode === "edit" ? (category?.description ?? "") : ""}
              placeholder="Descripción opcional"
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Guardando…" : mode === "create" ? "Crear" : "Guardar cambios"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
