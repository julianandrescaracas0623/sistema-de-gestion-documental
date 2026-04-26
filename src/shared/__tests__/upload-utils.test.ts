import { describe, it, expect } from "vitest";

import {
	isFileSizeValid,
	getFileExtension,
	isFileTypeAllowed,
	ALLOWED_DOCUMENT_TYPES,
} from "../lib/upload-utils";

describe("upload-utils", () => {
	describe("isFileSizeValid", () => {
		it("returns true when file is within limit", () => {
			// Arrange
			const file = new File(["content"], "test.pdf", { type: "application/pdf" });
			Object.defineProperty(file, "size", { value: 1024 * 1024 }); // 1MB

			// Act
			const result = isFileSizeValid(file, 5);

			// Assert
			expect(result).toBe(true);
		});

		it("returns true when file equals limit", () => {
			// Arrange
			const file = new File(["content"], "test.pdf", { type: "application/pdf" });
			Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 }); // Exactly 5MB

			// Act
			const result = isFileSizeValid(file, 5);

			// Assert
			expect(result).toBe(true);
		});

		it("returns false when file exceeds limit", () => {
			// Arrange
			const file = new File(["content"], "test.pdf", { type: "application/pdf" });
			Object.defineProperty(file, "size", { value: 10 * 1024 * 1024 }); // 10MB

			// Act
			const result = isFileSizeValid(file, 5);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe("getFileExtension", () => {
		it("returns extension in lowercase", () => {
			// Arrange + Act
			const result = getFileExtension("documento.PDF");

			// Assert
			expect(result).toBe("pdf");
		});

		it("returns extension without dot", () => {
			// Arrange + Act
			const result = getFileExtension("photo.jpg");

			// Assert
			expect(result).toBe("jpg");
		});

		it("returns empty string for files without extension", () => {
			// Arrange + Act
			const result = getFileExtension("README");

			// Assert
			expect(result).toBe("");
		});

		it("handles multiple dots in filename", () => {
			// Arrange + Act
			const result = getFileExtension("factura.enero.2024.pdf");

			// Assert
			expect(result).toBe("pdf");
		});
	});

	describe("isFileTypeAllowed", () => {
		it("returns true for PDF", () => {
			// Arrange
			const file = new File(["content"], "test.pdf", { type: "application/pdf" });

			// Act
			const result = isFileTypeAllowed(file);

			// Assert
			expect(result).toBe(true);
		});

		it("returns true for JPEG", () => {
			// Arrange
			const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });

			// Act
			const result = isFileTypeAllowed(file);

			// Assert
			expect(result).toBe(true);
		});

		it("returns true for PNG", () => {
			// Arrange
			const file = new File(["content"], "image.png", { type: "image/png" });

			// Act
			const result = isFileTypeAllowed(file);

			// Assert
			expect(result).toBe(true);
		});

		it("returns true for Word documents", () => {
			// Arrange
			const file = new File(
				["content"],
				"document.docx",
				{ type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
			);

			// Act
			const result = isFileTypeAllowed(file);

			// Assert
			expect(result).toBe(true);
		});

		it("returns true for Excel documents", () => {
			// Arrange
			const file = new File(
				["content"],
				"spreadsheet.xlsx",
				{ type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
			);

			// Act
			const result = isFileTypeAllowed(file);

			// Assert
			expect(result).toBe(true);
		});

		it("returns false for executable files", () => {
			// Arrange
			const file = new File(["content"], "virus.exe", { type: "application/x-msdownload" });

			// Act
			const result = isFileTypeAllowed(file);

			// Assert
			expect(result).toBe(false);
		});

		it("returns false for HTML files", () => {
			// Arrange
			const file = new File(["content"], "page.html", { type: "text/html" });

			// Act
			const result = isFileTypeAllowed(file);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe("ALLOWED_DOCUMENT_TYPES", () => {
		it("contains expected MIME types", () => {
			// Assert
			expect(ALLOWED_DOCUMENT_TYPES).toContain("application/pdf");
			expect(ALLOWED_DOCUMENT_TYPES).toContain("image/jpeg");
			expect(ALLOWED_DOCUMENT_TYPES).toContain("image/png");
			expect(ALLOWED_DOCUMENT_TYPES).toContain("application/msword");
		});

		it("is a const tuple", () => {
			// Assert - as const makes it readonly
			expect(ALLOWED_DOCUMENT_TYPES).toBeDefined();
			expect(Array.isArray(ALLOWED_DOCUMENT_TYPES)).toBe(true);
		});
	});
});
