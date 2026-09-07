import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PermissionKey } from "@/shared/lib/auth/permissions";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
      rpc: mockRpc,
    })
  ),
}));
vi.mock("@/shared/lib/auth/get-session", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
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

/** Wire mockFrom("documents") so .select().eq().maybeSingle() returns `row`
 *  and .update().eq().is().select() returns `updateResult`. */
function wireDocuments(row: unknown, updateResult: { data: unknown; error: unknown }) {
  mockFrom.mockImplementation((table: string) => {
    if (table !== "documents") return {};
    return {
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: row, error: null }) }),
      }),
      update: () => ({
        eq: () => ({
          is: () => ({ select: () => Promise.resolve(updateResult) }),
        }),
      }),
    };
  });
}

describe("softDeleteDocumentAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER_ID } } });
    mockRpc.mockResolvedValue({ error: null });
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue(session(["documents.read"]));
  });

  const activeDoc = {
    id: DOC_ID,
    deleted_at: null,
    uploaded_by: OTHER_ID,
  };

  it("denies a non-owner without documents.delete", async () => {
    wireDocuments(activeDoc, { data: [{ id: DOC_ID }], error: null });
    const { softDeleteDocumentAction } = await import("../actions/soft-delete-document.action");
    const fd = new FormData();
    fd.set("documentId", DOC_ID);

    const result = await softDeleteDocumentAction(null, fd);

    expect(result).toEqual({
      status: "error",
      message: "No tienes permiso para eliminar este documento.",
    });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("reports an error (not success) when the UPDATE affects no rows", async () => {
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue(session(["documents.delete"]));
    wireDocuments(activeDoc, { data: [], error: null }); // RLS blocked → 0 rows
    const { softDeleteDocumentAction } = await import("../actions/soft-delete-document.action");
    const fd = new FormData();
    fd.set("documentId", DOC_ID);

    const result = await softDeleteDocumentAction(null, fd);

    expect(result.status).toBe("error");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("soft-deletes (keeps the binary) when the caller is the uploader", async () => {
    wireDocuments(
      { ...activeDoc, uploaded_by: OWNER_ID },
      { data: [{ id: DOC_ID }], error: null }
    );
    const { softDeleteDocumentAction } = await import("../actions/soft-delete-document.action");
    const fd = new FormData();
    fd.set("documentId", DOC_ID);

    await expect(softDeleteDocumentAction(null, fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRpc).toHaveBeenCalledWith(
      "record_audit",
      expect.objectContaining({ p_action: "document.delete" })
    );
  });
});
