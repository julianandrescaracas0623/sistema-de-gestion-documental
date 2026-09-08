import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PermissionKey } from "@/shared/lib/auth/permissions";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn().mockResolvedValue({ error: null });
const mockStorageRemove = vi.fn().mockResolvedValue({ data: [], error: null });

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
      rpc: mockRpc,
      storage: { from: () => ({ remove: mockStorageRemove }) },
    })
  ),
}));
vi.mock("@/shared/lib/auth/get-session", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

const OWNER_ID = "22222222-2222-2222-2222-222222222222";
const A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

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

/** Chainable stub where every method returns `this` until `then`/terminal resolves `result`. */
function chain(result: { data: unknown; error: unknown }) {
  const p: Record<string, unknown> = {};
  for (const m of ["select", "in", "not", "update", "delete", "eq", "is", "order", "range"]) {
    p[m] = () => p;
  }
  p.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return p;
}

describe("bulk trash actions", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER_ID } } });
    mockRpc.mockResolvedValue({ error: null });
    mockStorageRemove.mockResolvedValue({ data: [], error: null });
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue(session(["documents.update", "documents.delete"]));
  });

  it("bulkRestore restores trashed rows the user may touch", async () => {
    const selectRes = [
      { id: A, deleted_at: "2026-01-01T00:00:00Z", uploaded_by: OWNER_ID },
      { id: B, deleted_at: "2026-01-01T00:00:00Z", uploaded_by: OWNER_ID },
    ];
    let call = 0;
    mockFrom.mockImplementation(() => {
      call += 1;
      return chain(
        call === 1
          ? { data: selectRes, error: null }
          : { data: [{ id: A }, { id: B }], error: null }
      );
    });

    const { bulkRestoreDocumentsAction } = await import("../actions/bulk-restore-documents.action");
    const fd = new FormData();
    fd.set("documentIds", `${A},${B}`);
    const result = await bulkRestoreDocumentsAction(null, fd);

    expect(result.status).toBe("success");
    expect(mockRpc).toHaveBeenCalledWith(
      "record_audit",
      expect.objectContaining({ p_action: "document.restore" })
    );
  });

  it("bulkRestore rejects an empty selection", async () => {
    const { bulkRestoreDocumentsAction } = await import("../actions/bulk-restore-documents.action");
    const fd = new FormData();
    fd.set("documentIds", "");
    const result = await bulkRestoreDocumentsAction(null, fd);
    expect(result.status).toBe("error");
  });

  it("bulkPurge denies a user without documents.delete", async () => {
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue(session(["documents.update"]));
    const { bulkPurgeDocumentsAction } = await import("../actions/bulk-purge-documents.action");
    const fd = new FormData();
    fd.set("documentIds", A);
    const result = await bulkPurgeDocumentsAction(null, fd);
    expect(result.status).toBe("error");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("emptyTrash purges every trashed row and removes storage objects", async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call += 1;
      return chain(
        call === 1
          ? { data: [{ id: A, storage_object_path: "p/a" }, { id: B, storage_object_path: "p/b" }], error: null }
          : { data: [{ id: A }, { id: B }], error: null }
      );
    });

    const { emptyTrashAction } = await import("../actions/empty-trash.action");
    const result = await emptyTrashAction();

    expect(result.status).toBe("success");
    expect(mockStorageRemove).toHaveBeenCalledWith(["p/a", "p/b"]);
    expect(mockRpc).toHaveBeenCalledWith(
      "record_audit",
      expect.objectContaining({ p_action: "document.purge" })
    );
  });

  it("emptyTrash reports an already-empty trash", async () => {
    mockFrom.mockImplementation(() => chain({ data: [], error: null }));
    const { emptyTrashAction } = await import("../actions/empty-trash.action");
    const result = await emptyTrashAction();
    expect(result.status).toBe("error");
  });
});
