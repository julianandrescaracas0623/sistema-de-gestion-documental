import { Users } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RoleFilterSelect } from "@/features/user-admin/components/RoleFilterSelect";
import { UserTable } from "@/features/user-admin/components/UserTable";
import { CreateUserForm } from "@/features/user-admin/components/create-user-form";
import { listRoles, listUsersWithRoles } from "@/features/user-admin/queries/users.queries";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getSession } from "@/shared/lib/auth/get-session";
import { canAccessModule } from "@/shared/lib/auth/permissions";

const PAGE_SIZE = 20;

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(v: string | string[] | undefined): string {
  if (v === undefined) return "";
  return Array.isArray(v) ? (v[0] ?? "") : v;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (session === null) redirect("/login");
  if (!canAccessModule(session.permissions, "users")) redirect("/");

  const sp = await searchParams;
  const roleFilter = firstParam(sp.role);
  const pageRaw = firstParam(sp.page);
  const parsedPage = Number.parseInt(pageRaw === "" ? "1" : pageRaw, 10);
  const pageNum = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const pageIndex = pageNum - 1;

  const [{ data: users, count, error: usersError }, { data: roles, error: rolesError }] =
    await Promise.all([
      listUsersWithRoles({
        ...(roleFilter !== "" ? { roleSlugFilter: roleFilter } : {}),
        page: pageIndex,
        pageSize: PAGE_SIZE,
      }),
      listRoles(),
    ]);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildQuery(nextPage: number) {
    const p = new URLSearchParams();
    if (roleFilter !== "") p.set("role", roleFilter);
    if (nextPage > 1) p.set("page", String(nextPage));
    const s = p.toString();
    return (s === "" ? "/admin/users" : `/admin/users?${s}`) as unknown as Route;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <p className="text-muted-foreground text-xs tracking-wide">
          Inicio <span className="opacity-50">/</span> Administración <span className="opacity-50">/</span>{" "}
          Usuarios
        </p>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Usuarios</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Alta, eliminación de cuentas y asignación de roles. Los documentos de usuarios eliminados se conservan.
        </p>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4 text-primary" />
                Listado de usuarios
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                {roles !== null ? <RoleFilterSelect value={roleFilter} roles={roles} /> : null}
                <Badge variant="outline">{String(total)} en total</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {usersError !== null ? (
              <p className="p-6 text-destructive" role="alert">
                No se pudo cargar el listado: {usersError.message}
              </p>
            ) : (
              <UserTable rows={users ?? []} currentAdminId={session.userId} />
            )}
          </CardContent>
          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-6 py-4 text-sm">
              <span className="text-muted-foreground">
                Página {String(pageNum)} de {String(totalPages)}
              </span>
              <div className="flex gap-2">
                {pageNum > 1 ? (
                  <Link
                    href={buildQuery(pageNum - 1)}
                    className="inline-flex h-8 items-center rounded-md border px-3 text-sm hover:bg-muted"
                  >
                    Anterior
                  </Link>
                ) : null}
                {pageNum < totalPages ? (
                  <Link
                    href={buildQuery(pageNum + 1)}
                    className="inline-flex h-8 items-center rounded-md border px-3 text-sm hover:bg-muted"
                  >
                    Siguiente
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </Card>

        {rolesError !== null ? (
          <p className="text-destructive" role="alert">
            No se pudieron cargar los roles: {rolesError.message}
          </p>
        ) : roles !== null && roles.length > 0 ? (
          <CreateUserForm roles={roles} />
        ) : null}
      </div>
    </div>
  );
}
