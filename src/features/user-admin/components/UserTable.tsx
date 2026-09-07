"use client";

import { Plus } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import { CreateUserForm } from "@/features/user-admin/components/create-user-form";
import { UserRowActions } from "@/features/user-admin/components/user-row-actions";
import {
  USER_PAGE_SIZE_OPTIONS,
  type RoleOption,
  type UserAdminRow,
  type UserSortKey,
} from "@/features/user-admin/queries/users.queries";
import { DataTableFooter, DataTableToolbar } from "@/shared/components/data-table-shell";
import { LocalDate } from "@/shared/components/local-date";
import { ServerSortHeader } from "@/shared/components/server-sort-header";
import type { SortDirection } from "@/shared/components/sortable-header";
import { TableSearch } from "@/shared/components/table-search";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Select } from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

function RoleBadge({ roleName, roleSlug }: { roleName: string; roleSlug: string }) {
  return <Badge variant={roleSlug === "admin" ? "default" : "secondary"}>{roleName}</Badge>;
}

interface UserTableProps {
  rows: UserAdminRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  fromItem: number;
  toItem: number;
  q: string;
  roleFilter: string;
  sort: UserSortKey;
  dir: SortDirection;
  roles: RoleOption[];
  currentAdminId: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function UserTable(props: UserTableProps) {
  const {
    rows,
    total,
    page,
    pageSize,
    totalPages,
    fromItem,
    toItem,
    q,
    roleFilter,
    sort,
    dir,
    roles,
    currentAdminId,
    canCreate,
    canUpdate,
    canDelete,
  } = props;
  const router = useRouter();

  const buildUrl = (overrides: {
    q?: string;
    role?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
    dir?: string;
  }): string => {
    const p = new URLSearchParams();
    const nextRole = overrides.role ?? roleFilter;
    const nextQ = overrides.q ?? q;
    const nextPage = overrides.page ?? page;
    const nextPageSize = overrides.pageSize ?? pageSize;
    const nextSort = overrides.sort ?? (sort === "created_at" && dir === "desc" ? "" : sort);
    if (nextRole !== "") p.set("role", nextRole);
    if (nextQ !== "") p.set("q", nextQ);
    if (nextPage > 1) p.set("page", String(nextPage));
    if (nextPageSize !== USER_PAGE_SIZE_OPTIONS[0]) p.set("pageSize", String(nextPageSize));
    if (nextSort !== "") {
      p.set("sort", nextSort);
      p.set("dir", overrides.dir ?? dir);
    }
    const s = p.toString();
    return s === "" ? "/admin/users" : `/admin/users?${s}`;
  };

  const go = (url: string) => {
    router.push(url as Route);
  };

  return (
    <Card className="gap-0 py-0">
      <DataTableToolbar
        search={
          <TableSearch
            value={q}
            debounceMs={350}
            placeholder="Buscar por nombre o correo…"
            onChange={(next) => {
              go(buildUrl({ q: next, page: 1 }));
            }}
          />
        }
      >
        <Select
          value={roleFilter}
          className="h-9 w-auto"
          onChange={(e) => {
            go(buildUrl({ role: e.target.value, page: 1 }));
          }}
        >
          <option value="">Todos los roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.slug}>
              {r.name}
            </option>
          ))}
        </Select>
        <Badge variant="outline">{String(total)} en total</Badge>
        {canCreate && roles.length > 0 ? (
          <CreateUserForm
            roles={roles}
            onSuccess={() => {
              router.refresh();
            }}
            trigger={
              <Button size="sm">
                <Plus className="size-4" />
                Nuevo usuario
              </Button>
            }
          />
        ) : null}
      </DataTableToolbar>

      {rows.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-foreground text-sm font-medium">
            {q !== "" || roleFilter !== "" ? "Sin resultados" : "No hay usuarios"}
          </p>
          {q !== "" || roleFilter !== "" ? (
            <p className="text-muted-foreground mt-1 text-sm">Ajusta la búsqueda o el filtro.</p>
          ) : null}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <ServerSortHeader
                  columnKey="fullName"
                  label="Nombre"
                  activeKey={sort}
                  activeDir={dir}
                  buildHref={(s, d) => buildUrl({ sort: s, dir: d, page: 1 })}
                />
              </TableHead>
              <TableHead>
                <ServerSortHeader
                  columnKey="email"
                  label="Correo electrónico"
                  activeKey={sort}
                  activeDir={dir}
                  buildHref={(s, d) => buildUrl({ sort: s, dir: d, page: 1 })}
                />
              </TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>
                <ServerSortHeader
                  columnKey="created_at"
                  label="Creado"
                  activeKey={sort}
                  activeDir={dir}
                  buildHref={(s, d) => buildUrl({ sort: s, dir: d, page: 1 })}
                />
              </TableHead>
              <TableHead className="w-24 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{row.email}</TableCell>
                <TableCell>
                  <RoleBadge roleName={row.roleName} roleSlug={row.roleSlug} />
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  <LocalDate date={row.created_at} />
                </TableCell>
                <TableCell className="text-right">
                  <UserRowActions
                    user={row}
                    roles={roles}
                    currentAdminId={currentAdminId}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <DataTableFooter
        page={page}
        totalPages={totalPages}
        total={total}
        fromItem={fromItem}
        toItem={toItem}
        pageSize={pageSize}
        pageSizeOptions={USER_PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          go(buildUrl({ pageSize: size, page: 1 }));
        }}
        buildHref={(p) => buildUrl({ page: p })}
      />
    </Card>
  );
}
