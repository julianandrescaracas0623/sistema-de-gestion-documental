import { describe, it, expect } from "vitest";

import { normalizeTagLabel, parseTagInput } from "@/features/documents/lib/tag-utils";

describe("tag-utils", () => {
  it("normalizes tag labels", () => {
    expect(normalizeTagLabel("  Hello   World  ")).toBe("hello world");
  });

  it("parses comma-separated unique tags", () => {
    expect(parseTagInput("A, a, B")).toEqual(["a", "b"]);
  });
});
