import { redirect } from "next/navigation";

import { UserTable } from "@/features/user-admin/components/UserTable";
import {
  USER_PAGE_SIZE_OPTIONS,
  USER_SORT_KEYS,
  type UserSortKey,
  listRoles,
  listUsersWithRoles,
} from "@/features/user-admin/queries/users.queries";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import type { SortDirection } from "@/shared/components/sortable-header";
import { getSession } from "@/shared/lib/auth/get-session";
import { canAccessModule, hasModulePermission } from "@/shared/lib/auth/permissions";

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

  const canCreate = hasModulePermission(session.permissions, "users", "create");
  const canUpdate = hasModulePermission(session.permissions, "users", "update");
  const canDelete = hasModulePermission(session.permissions, "users", "delete");

  const sp = await searchParams;
  const roleFilter = firstParam(sp.role);
  const q = firstParam(sp.q);

  const pageRaw = firstParam(sp.page);
  const parsedPage = Number.parseInt(pageRaw === "" ? "1" : pageRaw, 10);
  const pageNum = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

  const parsedSize = Number.parseInt(firstParam(sp.pageSize), 10);
  const pageSize = (USER_PAGE_SIZE_OPTIONS as readonly number[]).includes(parsedSize)
    ? parsedSize
    : USER_PAGE_SIZE_OPTIONS[0];

  const sortRaw = firstParam(sp.sort);
  const sort: UserSortKey = (USER_SORT_KEYS as readonly string[]).includes(sortRaw)
    ? (sortRaw as UserSortKey)
    : "created_at";
  const dir: SortDirection = firstParam(sp.dir) === "asc" ? "asc" : "desc";

  const [{ data: users, count, error: usersError }, { data: roles }] = await Promise.all([
    listUsersWithRoles({
      ...(roleFilter !== "" ? { roleSlugFilter: roleFilter } : {}),
      ...(q !== "" ? { q } : {}),
      page: pageNum - 1,
      pageSize,
      sort,
      dir,
    }),
    listRoles(),
  ]);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const fromItem = total === 0 ? 0 : (pageNum - 1) * pageSize + 1;
  const toItem = Math.min(pageNum * pageSize, total);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <PageBreadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Usuarios" }]} />
        <h1 className="text-foreground text-lg font-semibold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Alta, edición y eliminación de cuentas. Los documentos de usuarios eliminados se conservan.
        </p>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        {usersError !== null ? (
          <p className="text-destructive" role="alert">
            No se pudo cargar el listado: {usersError.message}
          </p>
        ) : (
          <UserTable
            rows={users ?? []}
            total={total}
            page={pageNum}
            pageSize={pageSize}
            totalPages={totalPages}
            fromItem={fromItem}
            toItem={toItem}
            q={q}
            roleFilter={roleFilter}
            sort={sort}
            dir={dir}
            roles={roles ?? []}
            currentAdminId={session.userId}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </div>
    </div>
  );
}
