import type { UserAdminRow } from "@/features/user-admin/queries/users.queries";
import { LocalDate } from "@/shared/components/local-date";
import { Badge } from "@/shared/components/ui/badge";

function RoleBadge({ role }: { role: "admin" | "user" }) {
  if (role === "admin") {
    return <Badge variant="default">Administrador</Badge>;
  }
  return <Badge variant="secondary">Usuario Administrativo</Badge>;
}

export function UserTable({ rows }: { rows: UserAdminRow[] }) {
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
              Correo electrónico
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Rol
            </th>
            <th className="text-muted-foreground px-6 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase">
              Creado
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-border hover:bg-muted/50 border-b transition-colors last:border-b-0"
            >
              <td className="px-6 py-4 font-medium">{row.email}</td>
              <td className="px-6 py-4">
                <RoleBadge role={row.role} />
              </td>
              <td className="px-6 py-4 text-muted-foreground">
                <LocalDate date={row.created_at} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
