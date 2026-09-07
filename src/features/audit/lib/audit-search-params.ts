export interface AuditSearchParams {
  actor: string;
  action: string;
  entityType: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

export const AUDIT_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

type RawParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return typeof v === "string" ? v : "";
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseAuditSearchParams(sp: RawParams): AuditSearchParams {
  const rawPage = Number.parseInt(str(sp.page), 10);
  const rawSize = Number.parseInt(str(sp.pageSize), 10);
  const dateFrom = str(sp.dateFrom);
  const dateTo = str(sp.dateTo);

  return {
    actor: str(sp.actor).slice(0, 120),
    action: str(sp.action).slice(0, 100),
    entityType: str(sp.entityType).slice(0, 60),
    dateFrom: ISO_DATE.test(dateFrom) ? dateFrom : "",
    dateTo: ISO_DATE.test(dateTo) ? dateTo : "",
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
    pageSize: (AUDIT_PAGE_SIZE_OPTIONS as readonly number[]).includes(rawSize)
      ? rawSize
      : DEFAULT_PAGE_SIZE,
  };
}

export function buildAuditQuery(params: Partial<AuditSearchParams>): string {
  const sp = new URLSearchParams();
  if (params.actor !== undefined && params.actor !== "") sp.set("actor", params.actor);
  if (params.action !== undefined && params.action !== "") sp.set("action", params.action);
  if (params.entityType !== undefined && params.entityType !== "") {
    sp.set("entityType", params.entityType);
  }
  if (params.dateFrom !== undefined && params.dateFrom !== "") sp.set("dateFrom", params.dateFrom);
  if (params.dateTo !== undefined && params.dateTo !== "") sp.set("dateTo", params.dateTo);
  if (params.pageSize !== undefined && params.pageSize !== DEFAULT_PAGE_SIZE) {
    sp.set("pageSize", String(params.pageSize));
  }
  if (params.page !== undefined && params.page > 1) sp.set("page", String(params.page));
  const s = sp.toString();
  return s === "" ? "" : `?${s}`;
}
