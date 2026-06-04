"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { createCategoryAction } from "@/features/categories/actions/create-category.action";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export function CreateCategoryForm() {
  const [state, formAction, isPending] = useActionState(createCategoryAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) return;
    if (state.status === "error") {
      toast.error(state.message);
    } else {
      toast.success(state.message);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva categoría</CardTitle>
        <CardDescription>
          Las categorías permiten organizar los documentos del sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          {state?.status === "error" && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="cat-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cat-name"
              name="name"
              required
              maxLength={120}
              disabled={isPending}
              placeholder="Ej. Órdenes médicas"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-description">Descripción</Label>
            <Input
              id="cat-description"
              name="description"
              maxLength={500}
              disabled={isPending}
              placeholder="Descripción opcional"
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Guardando…" : "Crear categoría"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
