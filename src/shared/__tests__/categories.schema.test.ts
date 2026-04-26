import { describe, it, expect } from "vitest";

import { insertCategorySchema, selectCategorySchema } from "../db/categories.schema";

describe("categories schema", () => {
	it("insertCategorySchema validates required fields", () => {
		// Arrange + Act
		const result = insertCategorySchema.safeParse({
			name: "Facturas",
		});

		// Assert
		expect(result.success).toBe(true);
	});

	it("insertCategorySchema accepts optional description", () => {
		// Arrange + Act
		const result = insertCategorySchema.safeParse({
			name: "Facturas",
			description: "Documentos de facturación mensual",
		});

		// Assert
		expect(result.success).toBe(true);
	});

	it("insertCategorySchema accepts optional color", () => {
		// Arrange + Act
		const result = insertCategorySchema.safeParse({
			name: "Facturas",
			color: "#FF5733",
		});

		// Assert
		expect(result.success).toBe(true);
	});

	it("insertCategorySchema accepts empty string (validation should be added at form level)", () => {
		// Note: z.string() accepts empty strings by default
		// Add .min(1) to schema if empty strings should be rejected
		// Arrange + Act
		const result = insertCategorySchema.safeParse({
			name: "",
		});

		// Assert
		expect(result.success).toBe(true);
	});

	it("selectCategorySchema is defined", () => {
		// Arrange + Act + Assert
		expect(selectCategorySchema).toBeDefined();
	});
});
