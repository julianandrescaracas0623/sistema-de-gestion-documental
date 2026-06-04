"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteTagAction } from "@/features/tags/actions/delete-tag.action";
import { updateTagAction } from "@/features/tags/actions/update-tag.action";
import type { TagAdminRow } from "@/features/tags/queries/tags.queries";
import { LocalDate } from "@/shared/components/local-date";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";

function EditTagSheet({ tag, onClose }: { tag: TagAdminRow; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(updateTagAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const onCloseRef = useRef(onClose);
  const router = useRouter();

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (state === null) return;
    if (state.status === "error") {
      toast.error(state.message);
    } else {
      toast.success(state.message);
      onCloseRef.current();
      router.refresh();
    }
  }, [state, router]);

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Editar etiqueta</SheetTitle>
        <SheetDescription>Modifica el nombre y guarda los cambios.</SheetDescription>
      </SheetHeader>
      <form ref={formRef} action={formAction} className="mt-6 space-y-4 px-1">
        <input type="hidden" name="id" value={tag.id} />
        <div className="space-y-2">
          <Label htmlFor="edit-tag-name">
            Nombre <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-tag-name"
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
  );
}

function DeleteTagSheet({ tag }: { tag: TagAdminRow }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", tag.id);
      const result = await deleteTagAction(null, fd);
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
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
          <SheetTitle>Eliminar etiqueta</SheetTitle>
          <SheetDescription>
            ¿Estás seguro que deseas eliminar la etiqueta "{tag.name}"? Se desvinculará de todos los documentos.
          </SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 pt-6">
          <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
            {isPending ? "Eliminando…" : "Confirmar"}
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function TagTable({ rows }: { rows: TagAdminRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm font-medium text-foreground">No hay etiquetas</p>
        <p className="mt-1 text-sm text-muted-foreground">Crea la primera etiqueta con el formulario inferior.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">Nombre</th>
            <th className="text-muted-foreground px-6 py-2.5 text-center text-[11.5px] font-semibold tracking-wide uppercase">Documentos</th>
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">Creada</th>
            <th className="text-muted-foreground px-6 py-2.5 text-right text-[11.5px] font-semibold tracking-wide uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-border hover:bg-muted/50 border-b transition-colors last:border-b-0">
              <td className="px-6 py-4 font-medium">{row.name}</td>
              <td className="px-6 py-4 text-center">
                <Badge variant={row.doc_count > 0 ? "default" : "secondary"}>{String(row.doc_count)}</Badge>
              </td>
              <td className="px-6 py-4 text-muted-foreground">
                <LocalDate date={row.created_at} />
              </td>
              <td className="px-6 py-4">
                <Sheet open={editingId === row.id} onOpenChange={(o) => { setEditingId(o ? row.id : null); }}>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditingId(row.id); }}>
                      Editar
                    </Button>
                    <DeleteTagSheet tag={row} />
                  </div>
                  <EditTagSheet tag={row} onClose={() => { setEditingId(null); }} />
                </Sheet>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
