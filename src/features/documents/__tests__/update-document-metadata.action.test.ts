import { describe, it, expect, vi, beforeEach } from "vitest";

import type { PermissionKey } from "@/shared/lib/auth/permissions";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();

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
vi.mock("@/shared/lib/audit/record-audit", () => ({ recordAudit: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/documents/lib/resolve-category-id", () => ({
  resolveCategoryId: vi.fn().mockResolvedValue({ categoryId: null, error: null }),
}));

const DOCUMENT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function sessionWith(permissions: PermissionKey[], userId = "user-1") {
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

function form(tags = ""): FormData {
  const fd = new FormData();
  fd.set("documentId", DOCUMENT_ID);
  fd.set("title", "Doc actualizado");
  fd.set("tags", tags);
  return fd;
}

describe("updateDocumentMetadataAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue(sessionWith(["documents.update"]));
    mockFrom.mockImplementation((table: string) => {
      if (table === "documents") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: DOCUMENT_ID, deleted_at: null, uploaded_by: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({ data: [{ id: DOCUMENT_ID }], error: null }),
            }),
          }),
        };
      }
      return {};
    });
    mockRpc.mockResolvedValue({ error: null });
  });

  it("syncs tags via the sync_document_tags RPC (empty array clears tags)", async () => {
    const { updateDocumentMetadataAction } = await import("../actions/update-document-metadata.action");
    const result = await updateDocumentMetadataAction(null, form(""));

    expect(result.status).toBe("success");
    expect(mockRpc).toHaveBeenCalledWith(
      "sync_document_tags",
      expect.objectContaining({ p_document_id: DOCUMENT_ID, p_tag_names: [] })
    );
  });

  it("passes normalized tag labels to the RPC", async () => {
    const { updateDocumentMetadataAction } = await import("../actions/update-document-metadata.action");
    await updateDocumentMetadataAction(null, form("Urgente, Factura"));

    expect(mockRpc).toHaveBeenCalledWith(
      "sync_document_tags",
      expect.objectContaining({ p_tag_names: ["urgente", "factura"] })
    );
  });

  it("returns an error and does not touch audit when tag sync fails", async () => {
    mockRpc.mockResolvedValue({ error: { message: "boom" } });
    const { updateDocumentMetadataAction } = await import("../actions/update-document-metadata.action");
    const result = await updateDocumentMetadataAction(null, form("urgente"));

    expect(result).toEqual({ status: "error", message: "No se pudieron actualizar las etiquetas." });
  });

  it("denies a user with neither documents.update nor ownership", async () => {
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue(sessionWith(["documents.read"], "someone-else"));

    const { updateDocumentMetadataAction } = await import("../actions/update-document-metadata.action");
    const result = await updateDocumentMetadataAction(null, form(""));

    expect(result).toEqual({ status: "error", message: "No tienes permiso para editar este documento." });
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
