import { describe, it, expect } from "vitest";

import { insertUserRoleSchema, selectUserRoleSchema } from "../db/user_roles.schema";

const ROLE_ID = "123e4567-e89b-12d3-a456-426614174001";
const USER_ID = "123e4567-e89b-12d3-a456-426614174000";

describe("user_roles schema", () => {
  it("insertUserRoleSchema validates required fields", () => {
    const result = insertUserRoleSchema.safeParse({
      userId: USER_ID,
      roleId: ROLE_ID,
    });

    expect(result.success).toBe(true);
  });

  it("insertUserRoleSchema rejects invalid roleId uuid", () => {
    const result = insertUserRoleSchema.safeParse({
      userId: USER_ID,
      roleId: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });

  it("insertUserRoleSchema rejects invalid userId uuid", () => {
    const result = insertUserRoleSchema.safeParse({
      userId: "not-a-uuid",
      roleId: ROLE_ID,
    });

    expect(result.success).toBe(false);
  });

  it("selectUserRoleSchema is defined", () => {
    expect(selectUserRoleSchema).toBeDefined();
  });
});
