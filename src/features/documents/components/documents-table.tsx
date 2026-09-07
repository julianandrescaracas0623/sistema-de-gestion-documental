import { DocumentsTableClient } from "./documents-table-client";

import type { DocumentSearchParams } from "@/features/documents/lib/documents-search-params";
import { getRolesForUploaders, listDocuments } from "@/features/documents/queries/documents.queries";
import { Card, CardContent } from "@/shared/components/ui/card";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasModulePermission } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";


export async function DocumentsTable({ params }: { params: DocumentSearchParams }) {
  const supabase = await createClient();
  const pageIndex = params.page - 1;

  const session = await getSession();
  const canDelete =
    session !== null && hasModulePermission(session.permissions, "documents", "delete");

  const { data: rows, count, error: listErr } = await listDocuments(supabase, {
    q: params.q,
    categoryId: params.categoryId,
    tagId: params.tagId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: pageIndex,
    pageSize: params.pageSize,
    sort: params.sort,
    dir: params.dir,
  });

  if (listErr !== null) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-destructive" role="alert">
            No se pudo cargar el listado: {listErr.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  const uploaderIds = [
    ...new Set((rows ?? []).map((r) => r.uploaded_by).filter((id): id is string => id !== null)),
  ];
  const roleMap = await getRolesForUploaders(uploaderIds);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const fromItem = total === 0 ? 0 : (params.page - 1) * params.pageSize + 1;
  const toItem = Math.min(params.page * params.pageSize, total);

  const exportParams = new URLSearchParams();
  if (params.q !== "") exportParams.set("q", params.q);
  if (params.categoryId !== "") exportParams.set("category", params.categoryId);
  if (params.tagId !== "") exportParams.set("tag", params.tagId);
  if (params.dateFrom !== "") exportParams.set("dateFrom", params.dateFrom);
  if (params.dateTo !== "") exportParams.set("dateTo", params.dateTo);

  return (
    <DocumentsTableClient
      rows={rows ?? []}
      roleMap={Object.fromEntries(roleMap)}
      params={params}
      total={total}
      totalPages={totalPages}
      fromItem={fromItem}
      toItem={toItem}
      exportQuery={exportParams.toString()}
      canDelete={canDelete}
    />
  );
}
