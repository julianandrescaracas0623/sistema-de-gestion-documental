"use client";

import { ChevronRight, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteRoleAction } from "@/features/role-admin/actions/delete-role.action";
import type { PermissionCatalogRow } from "@/features/role-admin/queries/permissions.queries";
import type { RoleAdminRow } from "@/features/role-admin/queries/roles.queries";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { LocalDate } from "@/shared/components/local-date";
import { TableRowActionsMenu } from "@/shared/components/table-row-actions-menu";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

function RoleRowActions({ row }: { row: RoleAdminRow }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", row.id);
      const result = await deleteRoleAction(null, formData);

      if (result.status === "error") {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setDeleteOpen(false);
      router.refresh();
    });
  };

  const canDelete = !row.is_system && row.user_count === 0;

  return (
    <>
      <TableRowActionsMenu
        items={[
          ...(canDelete
            ? [
                {
                  label: "Eliminar",
                  icon: Trash2,
                  destructive: true,
                  onSelect: () => {
                    setDeleteOpen(true);
                  },
                },
              ]
            : []),
        ]}
      />
      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar rol"
        description={
          <>
            ¿Eliminar el rol <strong>{row.name}</strong>? Esta acción no se puede deshacer.
          </>
        }
        confirmLabel={isPending ? "Eliminando…" : "Eliminar rol"}
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}

export function RoleTable({
  rows,
  permissions: _permissions,
}: {
  rows: RoleAdminRow[];
  permissions: PermissionCatalogRow[];
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <div className="bg-muted flex size-14 items-center justify-center rounded-full">
          <ShieldCheck className="text-muted-foreground size-6" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">No hay roles configurados</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Crea el primer rol personalizado para tu equipo.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/roles/new">Crear rol</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {rows.map((row) => (
        <div
          key={row.id}
          className="hover:bg-muted/40 flex flex-wrap items-center gap-4 px-4 py-4 transition-colors sm:px-6"
        >
          <Link
            href={`/admin/roles/${row.id}`}
            className="flex min-w-0 flex-1 items-center gap-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                row.is_system ? "bg-primary/15" : "bg-muted"
              )}
            >
              <ShieldCheck
                className={cn("size-4", row.is_system ? "text-primary" : "text-muted-foreground")}
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{row.name}</span>
                {row.is_system ? (
                  <Badge variant="outline" className="text-[10px]">
                    Sistema
                  </Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
                {row.description ?? "Sin descripción"}
              </p>
              <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span>{String(row.permission_keys.length)} permisos</span>
                <span aria-hidden>·</span>
                <span>
                  {String(row.user_count)} usuario{row.user_count === 1 ? "" : "s"}
                </span>
                <span aria-hidden>·</span>
                <LocalDate date={row.created_at} />
              </div>
            </div>
            <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/roles/${row.id}`}>
                <Pencil className="size-3.5" aria-hidden />
                Configurar
              </Link>
            </Button>
            <RoleRowActions row={row} />
          </div>
        </div>
      ))}
    </div>
  );
}
