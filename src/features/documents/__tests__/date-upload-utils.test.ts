import { describe, expect, it } from "vitest";

import {
  toLocalDateString,
  normalizeDateRange,
  findActiveQuickFilter,
  QUICK_FILTER_PRESETS,
} from "@/features/documents/lib/date-utils";
import { isFileTypeAllowed, getFileExtension } from "@/shared/lib/upload-utils";

describe("date-utils", () => {
  it("toLocalDateString uses local calendar date", () => {
    const d = new Date(2026, 5, 16);
    expect(toLocalDateString(d)).toBe("2026-06-16");
  });

  it("normalizeDateRange swaps inverted dates", () => {
    expect(normalizeDateRange("2026-06-10", "2026-06-01")).toEqual({
      dateFrom: "2026-06-01",
      dateTo: "2026-06-10",
    });
  });

  it("findActiveQuickFilter detects 6m preset", () => {
    const preset6m = QUICK_FILTER_PRESETS.find((p) => p.key === "6m");
    expect(preset6m).toBeDefined();
    if (preset6m === undefined) return;
    const { dateFrom, dateTo } = preset6m.getDates();
    expect(findActiveQuickFilter(dateFrom, dateTo)?.key).toBe("6m");
  });
});

describe("upload-utils", () => {
  it("rejects csv files", () => {
    const file = new File(["a,b"], "data.csv", { type: "text/csv" });
    expect(isFileTypeAllowed(file)).toBe(false);
    expect(getFileExtension("data.csv")).toBe("csv");
  });

  it("accepts pdf by extension when mime empty", () => {
    const file = new File(["%PDF"], "doc.pdf", { type: "" });
    expect(isFileTypeAllowed(file)).toBe(true);
  });
});
