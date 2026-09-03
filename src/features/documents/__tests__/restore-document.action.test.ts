import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PermissionKey } from "@/shared/lib/auth/permissions";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ auth: { getUser: mockGetUser }, from: mockFrom, rpc: mockRpc })
  ),
}));
vi.mock("@/shared/lib/auth/get-session", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

const DOC_ID = "11111111-1111-1111-1111-111111111111";
const OWNER_ID = "22222222-2222-2222-2222-222222222222";
const OTHER_ID = "33333333-3333-3333-3333-333333333333";

function session(permissions: PermissionKey[], userId = OWNER_ID) {
  return {
    userId,
    email: "u@test.com",
    fullName: "U",
    roleId: "r1",
    roleSlug: "user",
    roleName: "Usuario",
    permissions,
    role: "user" as const,
  };
}

function wire(row: unknown, updateResult: { data: unknown; error: unknown }) {
  mockFrom.mockImplementation((table: string) => {
    if (table !== "documents") return {};
    return {
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: row, error: null }) }),
      }),
      update: () => ({
        eq: () => ({ not: () => ({ select: () => Promise.resolve(updateResult) }) }),
      }),
    };
  });
}

describe("restoreDocumentAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER_ID } } });
    mockRpc.mockResolvedValue({ error: null });
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue(session(["documents.update"]));
  });

  const trashedDoc = { id: DOC_ID, deleted_at: "2026-09-01T00:00:00Z", uploaded_by: OTHER_ID };

  it("restores a trashed document and records an audit event", async () => {
    wire(trashedDoc, { data: [{ id: DOC_ID }], error: null });
    const { restoreDocumentAction } = await import("../actions/restore-document.action");
    const fd = new FormData();
    fd.set("documentId", DOC_ID);

    const result = await restoreDocumentAction(null, fd);

    expect(result).toEqual({ status: "success", message: "Documento restaurado." });
    expect(mockRpc).toHaveBeenCalledWith(
      "record_audit",
      expect.objectContaining({ p_action: "document.restore" })
    );
  });

  it("rejects a document that is not in the trash", async () => {
    wire({ ...trashedDoc, deleted_at: null }, { data: [], error: null });
    const { restoreDocumentAction } = await import("../actions/restore-document.action");
    const fd = new FormData();
    fd.set("documentId", DOC_ID);

    const result = await restoreDocumentAction(null, fd);
    expect(result.status).toBe("error");
  });

  it("denies a non-owner without documents.update", async () => {
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue(session(["documents.read"]));
    wire(trashedDoc, { data: [{ id: DOC_ID }], error: null });
    const { restoreDocumentAction } = await import("../actions/restore-document.action");
    const fd = new FormData();
    fd.set("documentId", DOC_ID);

    const result = await restoreDocumentAction(null, fd);
    expect(result.status).toBe("error");
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
