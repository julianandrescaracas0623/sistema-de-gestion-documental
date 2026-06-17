export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export interface DocumentSearchParams {
  q: string;
  categoryId: string;
  tagId: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstParam(v: string | string[] | undefined): string {
  if (v === undefined) return "";
  return Array.isArray(v) ? (v[0] ?? "") : v;
}

export function parseDocumentSearchParams(sp: RawSearchParams): DocumentSearchParams {
  const pageRaw = firstParam(sp.page);
  const parsedPage = Number.parseInt(pageRaw === "" ? "1" : pageRaw, 10);
  const pageNum = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

  const pageSizeRaw = firstParam(sp.pageSize);
  const parsedSize = Number.parseInt(pageSizeRaw === "" ? String(DEFAULT_PAGE_SIZE) : pageSizeRaw, 10);
  const pageSize = PAGE_SIZE_OPTIONS.includes(parsedSize as (typeof PAGE_SIZE_OPTIONS)[number])
    ? parsedSize
    : DEFAULT_PAGE_SIZE;

  return {
    q: firstParam(sp.q),
    categoryId: firstParam(sp.category),
    tagId: firstParam(sp.tag),
    dateFrom: firstParam(sp.dateFrom),
    dateTo: firstParam(sp.dateTo),
    page: pageNum,
    pageSize,
  };
}

export function buildDocumentsQueryPath(
  params: Partial<DocumentSearchParams> & { page?: number; pageSize?: number }
): string {
  const p = new URLSearchParams();
  if (params.q !== undefined && params.q !== "") p.set("q", params.q);
  if (params.categoryId !== undefined && params.categoryId !== "") p.set("category", params.categoryId);
  if (params.tagId !== undefined && params.tagId !== "") p.set("tag", params.tagId);
  if (params.dateFrom !== undefined && params.dateFrom !== "") p.set("dateFrom", params.dateFrom);
  if (params.dateTo !== undefined && params.dateTo !== "") p.set("dateTo", params.dateTo);
  if (params.page !== undefined && params.page > 1) p.set("page", String(params.page));
  if (params.pageSize !== undefined && params.pageSize !== DEFAULT_PAGE_SIZE) {
    p.set("pageSize", String(params.pageSize));
  }
  const s = p.toString();
  return s === "" ? "/documents" : `/documents?${s}`;
}

export function buildPageLink(params: DocumentSearchParams, page: number): string {
  return buildDocumentsQueryPath({ ...params, page });
}

export function serializeDocumentSearchKey(params: DocumentSearchParams): string {
  return [
    params.q,
    params.categoryId,
    params.tagId,
    params.dateFrom,
    params.dateTo,
    String(params.page),
    String(params.pageSize),
  ].join("|");
}
