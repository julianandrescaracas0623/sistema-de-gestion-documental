import { describe, it, expect } from "vitest";

import { formFieldText, formFieldTextArray } from "../lib/form-utils";

describe("form-utils", () => {
	describe("formFieldText", () => {
		it("returns empty string when key does not exist", () => {
			// Arrange
			const formData = new FormData();

			// Act
			const result = formFieldText(formData, "name");

			// Assert
			expect(result).toBe("");
		});

		it("returns empty string when value is null", () => {
			// Arrange
			const formData = new FormData();
			formData.append("name", "");

			// Act
			const result = formFieldText(formData, "name");

			// Assert
			expect(result).toBe("");
		});

		it("returns string value when key exists", () => {
			// Arrange
			const formData = new FormData();
			formData.append("name", "John Doe");

			// Act
			const result = formFieldText(formData, "name");

			// Assert
			expect(result).toBe("John Doe");
		});

		it("converts non-string values to string", () => {
			// Arrange
			const formData = new FormData();
			formData.append("count", "42" as unknown as string);

			// Act
			const result = formFieldText(formData, "count");

			// Assert
			expect(result).toBe("42");
		});
	});

	describe("formFieldTextArray", () => {
		it("returns empty array when key does not exist", () => {
			// Arrange
			const formData = new FormData();

			// Act
			const result = formFieldTextArray(formData, "tags");

			// Assert
			expect(result).toEqual([]);
		});

		it("returns array with single value", () => {
			// Arrange
			const formData = new FormData();
			formData.append("tags", "factura");

			// Act
			const result = formFieldTextArray(formData, "tags");

			// Assert
			expect(result).toEqual(["factura"]);
		});

		it("returns array with multiple values", () => {
			// Arrange
			const formData = new FormData();
			formData.append("tags", "factura");
			formData.append("tags", "enero");
			formData.append("tags", "2024");

			// Act
			const result = formFieldTextArray(formData, "tags");

			// Assert
			expect(result).toEqual(["factura", "enero", "2024"]);
		});

		it("handles mixed empty and non-empty values", () => {
			// Arrange
			const formData = new FormData();
			formData.append("tags", "factura");
			formData.append("tags", "");

			// Act
			const result = formFieldTextArray(formData, "tags");

			// Assert
			expect(result).toEqual(["factura", ""]);
		});
	});
});
