import { DeleteUserButton } from "@/features/user-admin/components/delete-user-button";
import type { UserAdminRow } from "@/features/user-admin/queries/users.queries";
import { LocalDate } from "@/shared/components/local-date";
import { Badge } from "@/shared/components/ui/badge";

function RoleBadge({ roleName, roleSlug }: { roleName: string; roleSlug: string }) {
  const variant = roleSlug === "admin" ? "default" : "secondary";
  return <Badge variant={variant}>{roleName}</Badge>;
}

export function UserTable({ rows, currentAdminId }: { rows: UserAdminRow[]; currentAdminId: string }) {
  if (rows.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm font-medium text-foreground">No hay usuarios</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Nombre
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Correo electrónico
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Rol
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Creado
            </th>
            <th className="text-muted-foreground w-16 px-6 py-2.5 text-right text-[11.5px] font-semibold tracking-wide uppercase">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-border hover:bg-muted/50 border-b transition-colors last:border-b-0"
            >
              <td className="px-6 py-4 font-medium">{row.fullName}</td>
              <td className="px-6 py-4 text-muted-foreground">{row.email}</td>
              <td className="px-6 py-4">
                <RoleBadge roleName={row.roleName} roleSlug={row.roleSlug} />
              </td>
              <td className="px-6 py-4 text-muted-foreground">
                <LocalDate date={row.created_at} />
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end">
                  {row.id !== currentAdminId ? (
                    <DeleteUserButton userId={row.id} email={row.email} />
                  ) : (
                    <span className="text-muted-foreground text-xs">Tu cuenta</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
