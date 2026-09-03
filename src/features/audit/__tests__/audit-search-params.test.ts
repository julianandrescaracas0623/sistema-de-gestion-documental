import { describe, expect, it } from "vitest";

import { buildAuditQuery, parseAuditSearchParams } from "@/features/audit/lib/audit-search-params";

describe("parseAuditSearchParams", () => {
  it("applies defaults for an empty query", () => {
    expect(parseAuditSearchParams({})).toEqual({
      actor: "",
      action: "",
      entityType: "",
      dateFrom: "",
      dateTo: "",
      page: 1,
      pageSize: 25,
    });
  });

  it("keeps valid values and rejects a bad page size", () => {
    const p = parseAuditSearchParams({
      actor: "ana@ips",
      action: "document.delete",
      dateFrom: "2026-01-01",
      dateTo: "bad-date",
      page: "3",
      pageSize: "999",
    });
    expect(p.actor).toBe("ana@ips");
    expect(p.action).toBe("document.delete");
    expect(p.dateFrom).toBe("2026-01-01");
    expect(p.dateTo).toBe("");
    expect(p.page).toBe(3);
    expect(p.pageSize).toBe(25);
  });
});

describe("buildAuditQuery", () => {
  it("omits defaults and empty values", () => {
    expect(buildAuditQuery({ page: 1, pageSize: 25 })).toBe("");
    expect(buildAuditQuery({ actor: "x", page: 2 })).toBe("?actor=x&page=2");
  });
});
