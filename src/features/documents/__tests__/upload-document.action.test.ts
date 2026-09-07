import { describe, it, expect, vi, beforeEach } from "vitest";

import type { PermissionKey } from "@/shared/lib/auth/permissions";

const mockGetUser = vi.fn();
const mockStorageFrom = vi.fn();
const mockStorageRemove = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      storage: { from: mockStorageFrom },
      from: mockFrom,
      rpc: mockRpc,
    })
  ),
}));

vi.mock("@/shared/lib/auth/get-session", () => ({ getSession: vi.fn() }));
vi.mock("@/shared/lib/audit/record-audit", () => ({ recordAudit: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

/** jsdom's File lacks arrayBuffer(); the action needs it to read the upload body. */
function makeUploadFile(name: string, type: string): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "arrayBuffer", {
    value: () => Promise.resolve(new TextEncoder().encode("x").buffer),
  });
  return file;
}

function sessionWith(permissions: PermissionKey[]) {
  return {
    userId: "user-1",
    email: "u@test.com",
    fullName: "U",
    roleId: "r1",
    roleSlug: "user",
    roleName: "Usuario",
    permissions,
    role: "user" as const,
  };
}

describe("uploadDocumentAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue(sessionWith(["documents.create"]));
    mockStorageRemove.mockResolvedValue({ error: null });
    mockStorageFrom.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: mockStorageRemove,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "documents") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
          delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        };
      }
      return {};
    });
    mockRpc.mockResolvedValue({ error: null });
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { uploadDocumentAction } = await import("../actions/upload-document.action");
    const fd = new FormData();
    fd.set("title", "Doc");
    const file = new File(["x"], "a.pdf", { type: "application/pdf" });
    fd.set("file", file);

    const result = await uploadDocumentAction(null, fd);

    expect(result).toEqual({ status: "error", message: "Debes iniciar sesión para subir documentos." });
  });

  it("returns error when file is missing", async () => {
    const { uploadDocumentAction } = await import("../actions/upload-document.action");
    const fd = new FormData();
    fd.set("title", "Doc");

    const result = await uploadDocumentAction(null, fd);

    expect(result).toEqual({ status: "error", message: "Selecciona un archivo válido." });
  });

  it("denies a user without documents.create", async () => {
    const { getSession } = await import("@/shared/lib/auth/get-session");
    vi.mocked(getSession).mockResolvedValue(sessionWith(["documents.read"]));
    const { uploadDocumentAction } = await import("../actions/upload-document.action");
    const fd = new FormData();
    fd.set("title", "Doc");
    fd.set("file", new File(["x"], "a.pdf", { type: "application/pdf" }));

    const result = await uploadDocumentAction(null, fd);

    expect(result).toEqual({ status: "error", message: "No tienes permiso para subir documentos." });
  });

  it("syncs tags via the sync_document_tags RPC when tags are provided", async () => {
    const { uploadDocumentAction } = await import("../actions/upload-document.action");
    const fd = new FormData();
    fd.set("title", "Doc");
    fd.set("file", makeUploadFile("a.pdf", "application/pdf"));
    fd.set("tags", "urgente, factura");

    await uploadDocumentAction(null, fd);

    expect(mockRpc).toHaveBeenCalledWith(
      "sync_document_tags",
      expect.objectContaining({ p_tag_names: ["urgente", "factura"] })
    );
  });

  it("rolls back the document and file when tag sync fails", async () => {
    mockRpc.mockResolvedValue({ error: { message: "boom" } });
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "documents") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
          delete: vi.fn().mockReturnValue({ eq: deleteEq }),
        };
      }
      return {};
    });

    const { uploadDocumentAction } = await import("../actions/upload-document.action");
    const fd = new FormData();
    fd.set("title", "Doc");
    fd.set("file", makeUploadFile("a.pdf", "application/pdf"));
    fd.set("tags", "urgente");

    const result = await uploadDocumentAction(null, fd);

    expect(result).toEqual({ status: "error", message: "No se pudieron guardar las etiquetas." });
    expect(deleteEq).toHaveBeenCalled();
    expect(mockStorageRemove).toHaveBeenCalled();
  });
});
