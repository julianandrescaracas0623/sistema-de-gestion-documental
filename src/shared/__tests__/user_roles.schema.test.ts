import { describe, it, expect } from "vitest";

import { insertUserRoleSchema, selectUserRoleSchema, ROLE_NAMES } from "../db/user_roles.schema";

describe("user_roles schema", () => {
	it("insertUserRoleSchema validates required fields", () => {
		// Arrange + Act
		const result = insertUserRoleSchema.safeParse({
			userId: "123e4567-e89b-12d3-a456-426614174000",
			role: "admin",
		});

		// Assert
		expect(result.success).toBe(true);
	});

	it("insertUserRoleSchema accepts user role", () => {
		// Arrange + Act
		const result = insertUserRoleSchema.safeParse({
			userId: "123e4567-e89b-12d3-a456-426614174000",
			role: "user",
		});

		// Assert
		expect(result.success).toBe(true);
	});

	it("insertUserRoleSchema validates when role is omitted (default is applied at DB level)", () => {
		// Note: Drizzle's .default() applies at database level, not Zod validation level
		// The Zod schema will accept the input without role, but DB will apply default
		// Arrange + Act
		const result = insertUserRoleSchema.safeParse({
			userId: "123e4567-e89b-12d3-a456-426614174000",
		});

		// Assert - validation passes (role is optional in Zod schema)
		expect(result.success).toBe(true);
	});

	it("insertUserRoleSchema rejects invalid role", () => {
		// Arrange + Act
		const result = insertUserRoleSchema.safeParse({
			userId: "123e4567-e89b-12d3-a456-426614174000",
			role: "superadmin",
		});

		// Assert
		expect(result.success).toBe(false);
	});

	it("insertUserRoleSchema rejects invalid userId uuid", () => {
		// Arrange + Act
		const result = insertUserRoleSchema.safeParse({
			userId: "not-a-uuid",
			role: "admin",
		});

		// Assert
		expect(result.success).toBe(false);
	});

	it("ROLE_NAMES contains expected values", () => {
		// Arrange + Act + Assert
		expect(ROLE_NAMES).toContain("admin");
		expect(ROLE_NAMES).toContain("user");
		expect(ROLE_NAMES).toHaveLength(2);
	});

	it("selectUserRoleSchema is defined", () => {
		// Arrange + Act + Assert
		expect(selectUserRoleSchema).toBeDefined();
	});
});
