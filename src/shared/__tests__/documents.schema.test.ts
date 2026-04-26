import { describe, it, expect } from "vitest";

import { insertDocumentSchema, selectDocumentSchema } from "../db/documents.schema";

const validUuid = "123e4567-e89b-12d3-a456-426614174000";

describe("documents schema", () => {
  it("insertDocumentSchema validates required fields", () => {
    const result = insertDocumentSchema.safeParse({
      title: "Factura Enero 2024",
      fileName: "factura-enero.pdf",
      storageObjectPath: `${validUuid}/doc-id/factura-enero.pdf`,
      sizeBytes: 1_024_000,
      mimeType: "application/pdf",
      uploadedBy: validUuid,
    });

    expect(result.success).toBe(true);
  });

  it("insertDocumentSchema accepts optional categoryId", () => {
    const result = insertDocumentSchema.safeParse({
      title: "Factura Enero 2024",
      fileName: "factura-enero.pdf",
      storageObjectPath: `${validUuid}/doc-id/factura-enero.pdf`,
      sizeBytes: 1_024_000,
      mimeType: "application/pdf",
      uploadedBy: validUuid,
      categoryId: "123e4567-e89b-12d3-a456-426614174001",
    });

    expect(result.success).toBe(true);
  });

  it("insertDocumentSchema accepts optional description", () => {
    const result = insertDocumentSchema.safeParse({
      title: "Factura Enero 2024",
      description: "Notas internas",
      fileName: "factura-enero.pdf",
      storageObjectPath: `${validUuid}/doc-id/factura-enero.pdf`,
      sizeBytes: 1_024_000,
      mimeType: "application/pdf",
      uploadedBy: validUuid,
    });

    expect(result.success).toBe(true);
  });

  it("insertDocumentSchema rejects invalid uploadedBy uuid", () => {
    const result = insertDocumentSchema.safeParse({
      title: "Factura Enero 2024",
      fileName: "factura-enero.pdf",
      storageObjectPath: "path",
      sizeBytes: 1,
      mimeType: "application/pdf",
      uploadedBy: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });

  it("selectDocumentSchema is defined", () => {
    expect(selectDocumentSchema).toBeDefined();
  });
});
