import { describe, it, expect, vi, beforeEach } from "vitest";

import type { PermissionKey } from "@/shared/lib/auth/permissions";

const mockGetUser = vi.fn();
const mockStorageFrom = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      storage: { from: mockStorageFrom },
      from: mockFrom,
    })
  ),
}));

vi.mock("@/shared/lib/auth/get-session", () => ({ getSession: vi.fn() }));

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
    mockStorageFrom.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "documents") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      }
      if (table === "tags") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "tag-1" }, error: null }),
            }),
          }),
        };
      }
      if (table === "document_tags") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });
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
});
