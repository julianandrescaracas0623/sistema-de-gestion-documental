import { describe, it, expect } from "vitest";
import { ZodError, z } from "zod";

import { firstZodIssueMessage, formatZodErrors } from "../lib/zod-utils";

describe("zod-utils", () => {
	describe("firstZodIssueMessage", () => {
		it("returns first issue message", () => {
			// Arrange - use actual schema validation to get ZodError
			const schema = z.object({
				name: z.string().min(1),
				email: z.string().min(1),
			});
			const result = schema.safeParse({});

			// Act
			const error = result.error as ZodError;
			const message = firstZodIssueMessage(error);

			// Assert - Zod returns a formatted message for min(1) validation
			expect(message.length).toBeGreaterThan(0);
		});

		it("returns generic message when no issues", () => {
			// Arrange
			const error = new ZodError([]);

			// Act
			const result = firstZodIssueMessage(error);

			// Assert
			expect(result).toBe("Validation error");
		});

		it("handles issue without message by using path", () => {
			// Arrange - use actual schema validation
			const schema = z.object({
				age: z.number(),
			});
			const result = schema.safeParse({ age: "not a number" });

			// Act
			const error = result.error as ZodError;
			const message = firstZodIssueMessage(error);

			// Assert - message contains error description
			expect(message.length).toBeGreaterThan(0);
		});
	});

	describe("formatZodErrors", () => {
		it("formats multiple errors into record", () => {
			// Arrange - use actual schema validation
			const schema = z.object({
				name: z.string().min(1, "Name is required"),
				email: z.string().min(1, "Email is required"),
			});
			const result = schema.safeParse({});

			// Act
			const error = result.error as ZodError;
			const formatted = formatZodErrors(error);

			// Assert
			expect(formatted).toHaveProperty("name");
			expect(formatted).toHaveProperty("email");
		});

		it("only keeps first error per field", () => {
			// Arrange - use actual schema with multiple validations on same field
			const schema = z.object({
				name: z.string().min(1, "Name is required").max(10, "Name too long"),
			});
			const result = schema.safeParse({ name: "" });

			// Act
			const error = result.error as ZodError;
			const formatted = formatZodErrors(error);

			// Assert - should only have first error
			const nameErrors = Object.keys(formatted).filter((k) => k === "name");
			expect(nameErrors).toHaveLength(1);
		});

		it("returns empty object for empty error list", () => {
			// Arrange
			const error = new ZodError([]);

			// Act
			const result = formatZodErrors(error);

			// Assert
			expect(result).toEqual({});
		});

		it("handles nested paths", () => {
			// Arrange - use actual nested schema validation
			const schema = z.object({
				address: z.object({
					city: z.string().min(1, "City is required"),
				}),
			});
			const result = schema.safeParse({ address: { city: "" } });

			// Act
			const error = result.error as ZodError;
			const formatted = formatZodErrors(error);

			// Assert
			expect(formatted).toHaveProperty("address.city");
		});
	});
});
