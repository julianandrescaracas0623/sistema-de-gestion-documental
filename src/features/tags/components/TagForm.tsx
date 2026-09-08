"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createTagAction } from "@/features/tags/actions/create-tag.action";
import { updateTagAction } from "@/features/tags/actions/update-tag.action";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface TagFormProps {
  mode: "create" | "edit";
  tag?: { id: string; name: string };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TagForm({
  mode,
  tag,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: TagFormProps) {
  const action = mode === "create" ? createTagAction : updateTagAction;
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(value);
      return;
    }
    setInternalOpen(value);
  };
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
      if (isControlled) {
        controlledOnOpenChange?.(false);
      } else {
        setInternalOpen(false);
      }
      onSuccessRef.current?.();
    }
  }, [state, isControlled, controlledOnOpenChange]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nueva etiqueta" : "Editar etiqueta"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Las etiquetas permiten clasificar documentos con múltiples criterios."
              : "Modifica el nombre y guarda los cambios."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {mode === "edit" && tag !== undefined ? (
            <input type="hidden" name="id" value={tag.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="tag-form-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tag-form-name"
              name="name"
              required
              maxLength={120}
              disabled={isPending}
              defaultValue={mode === "edit" ? (tag?.name ?? "") : ""}
              placeholder="Ej. urgente, 2024, factura"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Guardando…" : mode === "create" ? "Crear" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
