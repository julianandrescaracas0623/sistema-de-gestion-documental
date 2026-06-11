"use client";

import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { createRoleAction } from "@/features/role-admin/actions/create-role.action";
import { updateRoleAction } from "@/features/role-admin/actions/update-role.action";
import { PermissionMatrix } from "@/features/role-admin/components/PermissionMatrix";
import type { PermissionCatalogRow } from "@/features/role-admin/queries/permissions.queries";
import type { RoleAdminRow } from "@/features/role-admin/queries/roles.queries";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import type { ActionResult } from "@/shared/lib/action-result";

const idleState: ActionResult = { status: "idle" };

export function RoleEditor({
  permissions,
  role,
  mode,
}: {
  permissions: PermissionCatalogRow[];
  role?: RoleAdminRow;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const isEdit = mode === "edit" && role !== undefined;
  const action = isEdit ? updateRoleAction : createRoleAction;
  const [state, formAction] = useActionState(action, idleState);
  const [isPending, startTransition] = useTransition();
  const [selectedKeys, setSelectedKeys] = useState<string[]>(role?.permission_keys ?? []);
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");

  useEffect(() => {
    if (state.status === "error") toast.error(state.message);
    if (state.status === "success") {
      toast.success(state.message);
      if (isEdit) {
        router.refresh();
      } else {
        router.push("/admin/roles");
      }
    }
  }, [state, isEdit, router]);

  const submit = () => {
    const fd = new FormData();
    if (isEdit) fd.set("id", role.id);
    fd.set("name", name);
    fd.set("description", description);
    fd.set("permissionKeys", selectedKeys.join(","));
    startTransition(() => {
      formAction(fd);
    });
  };

  const title = isEdit ? role.name : "Nuevo rol";
  const subtitle = isEdit
    ? "Configura los permisos y metadatos de este rol."
    : "Define un rol personalizado y asigna permisos del catálogo.";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <PageBreadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Roles", href: "/admin/roles" },
            { label: isEdit ? "Editar rol" : "Nuevo rol" },
          ]}
        />
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="bg-primary/10 flex size-11 shrink-0 items-center justify-center rounded-xl">
              <ShieldCheck className="text-primary size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
                {isEdit && role.is_system ? (
                  <Badge variant="outline" className="text-[10px]">
                    Rol del sistema
                  </Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p>
              {isEdit ? (
                <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" aria-hidden />
                    {String(role.user_count)} usuario{role.user_count === 1 ? "" : "s"} asignado
                    {role.user_count === 1 ? "" : "s"}
                  </span>
                  <span className="text-muted-foreground/40" aria-hidden>
                    ·
                  </span>
                  <span>
                    {String(selectedKeys.length)} permiso{selectedKeys.length === 1 ? "" : "s"} seleccionado
                    {selectedKeys.length === 1 ? "" : "s"}
                  </span>
                  <span className="text-muted-foreground/40" aria-hidden>
                    ·
                  </span>
                  <span className="font-mono text-[11px]">{role.slug}</span>
                </div>
              ) : null}
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/admin/roles">
              <ArrowLeft className="size-4" aria-hidden />
              Volver al listado
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <div
          className="space-y-6 lg:grid lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start lg:gap-8 lg:space-y-0"
          data-testid={isEdit ? "edit-role-form" : "create-role-form"}
        >
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">Datos del rol</CardTitle>
              <CardDescription>
                Nombre visible al asignar el rol en el alta de usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.status === "error" ? (
                <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.message}
                </p>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="role-name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  disabled={isEdit && role.is_system}
                  placeholder="Ej. Revisor documental"
                  maxLength={80}
                />
                {isEdit && role.is_system ? (
                  <p className="text-muted-foreground text-xs">
                    Los roles del sistema no pueden renombrarse.
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role-description">Descripción</Label>
                <textarea
                  id="role-description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                  }}
                  rows={4}
                  maxLength={500}
                  placeholder="Describe el propósito de este rol en la IPS…"
                  className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-[96px] w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <Separator />

              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <Button type="button" className="w-full" loading={isPending} onClick={submit}>
                  {isEdit ? "Guardar cambios" : "Crear rol"}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/admin/roles">Cancelar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Matriz de permisos</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Activa solo las capacidades necesarias. Los cambios aplican a todos los usuarios con
                este rol.
              </p>
            </div>
            <PermissionMatrix
              permissions={permissions}
              selectedKeys={selectedKeys}
              onChange={setSelectedKeys}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
