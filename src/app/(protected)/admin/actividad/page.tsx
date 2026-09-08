import { History } from "lucide-react";
import { redirect } from "next/navigation";

import { AuditTable } from "@/features/audit/components/audit-table";
import { parseAuditSearchParams, buildAuditQuery } from "@/features/audit/lib/audit-search-params";
import { listAuditActions, listAuditLog } from "@/features/audit/queries/audit.queries";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import { getSession } from "@/shared/lib/auth/get-session";
import { canAccessModule } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminActividadPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (session === null) redirect("/login");
  if (!canAccessModule(session.permissions, "audit")) redirect("/");

  const sp = await searchParams;
  const params = parseAuditSearchParams(sp);

  const supabase = await createClient();
  const [{ data: rows, count, error }, actions] = await Promise.all([
    listAuditLog(supabase, params),
    listAuditActions(supabase),
  ]);

  const exportQuery = buildAuditQuery({
    actor: params.actor,
    action: params.action,
    entityType: params.entityType,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <PageBreadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Actividad" }]} />
        <h1 className="text-foreground flex items-center gap-2 text-lg font-semibold tracking-tight">
          <History className="text-primary size-5" aria-hidden />
          Actividad
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Registro de acciones del sistema: quién hizo qué y cuándo.
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        {error !== null ? (
          <p className="text-destructive" role="alert">
            No se pudo cargar la actividad: {error.message}
          </p>
        ) : (
          <AuditTable
            rows={rows}
            total={count}
            params={params}
            actions={actions}
            exportQuery={exportQuery}
          />
        )}
      </div>
    </div>
  );
}
