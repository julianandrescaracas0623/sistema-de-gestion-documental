import { describe, expect, it, vi } from "vitest";

import { recordAudit } from "@/shared/lib/audit/record-audit";

function fake(rpc: ReturnType<typeof vi.fn>): { rpc: ReturnType<typeof vi.fn> } {
  return { rpc };
}

describe("recordAudit", () => {
  it("calls the record_audit RPC with mapped params", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    await recordAudit(fake(rpc) as never, {
      action: "document.upload",
      entityType: "document",
      entityId: "doc-1",
      summary: "Contrato.pdf",
      metadata: { sizeBytes: 10 },
    });

    expect(rpc).toHaveBeenCalledWith("record_audit", {
      p_action: "document.upload",
      p_entity_type: "document",
      p_entity_id: "doc-1",
      p_summary: "Contrato.pdf",
      p_metadata: { sizeBytes: 10 },
    });
  });

  it("defaults optional fields", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    await recordAudit(fake(rpc) as never, { action: "login", entityType: "session" });
    expect(rpc).toHaveBeenCalledWith("record_audit", {
      p_action: "login",
      p_entity_type: "session",
      p_entity_id: null,
      p_summary: null,
      p_metadata: {},
    });
  });

  it("never throws when the RPC rejects", async () => {
    const rpc = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(
      recordAudit(fake(rpc) as never, { action: "x", entityType: "y" })
    ).resolves.toBeUndefined();
  });
});
