import { UserRowActions } from "@/features/user-admin/components/user-row-actions";
import type { RoleOption, UserAdminRow, UserSortKey } from "@/features/user-admin/queries/users.queries";
import { LocalDate } from "@/shared/components/local-date";
import { ServerSortHeader } from "@/shared/components/server-sort-header";
import type { SortDirection } from "@/shared/components/sortable-header";
import { Badge } from "@/shared/components/ui/badge";
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

export function UserTable({
  rows,
  currentAdminId,
  roles,
  canUpdate,
  canDelete,
  sort,
  dir,
  buildSortHref,
}: {
  rows: UserAdminRow[];
  currentAdminId: string;
  roles: RoleOption[];
  canUpdate: boolean;
  canDelete: boolean;
  sort: UserSortKey;
  dir: SortDirection;
  buildSortHref: (sort: string, dir: SortDirection) => string;
}) {
  if (rows.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-foreground text-sm font-medium">No hay usuarios</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>
            <ServerSortHeader
              columnKey="fullName"
              label="Nombre"
              activeKey={sort}
              activeDir={dir}
              buildHref={buildSortHref}
            />
          </TableHead>
          <TableHead>
            <ServerSortHeader
              columnKey="email"
              label="Correo electrónico"
              activeKey={sort}
              activeDir={dir}
              buildHref={buildSortHref}
            />
          </TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>
            <ServerSortHeader
              columnKey="created_at"
              label="Creado"
              activeKey={sort}
              activeDir={dir}
              buildHref={buildSortHref}
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
  );
}
