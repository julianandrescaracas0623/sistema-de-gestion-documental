import { describe, expect, it, vi } from "vitest";

import { getOwnProfile } from "../queries/profile.queries";

function mockSupabase(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { from } as never;
}

describe("getOwnProfile", () => {
  it("maps the row to camelCase fields", async () => {
    const supabase = mockSupabase({
      data: {
        id: "u1",
        email: "user@test.com",
        first_name: "Ana",
        last_name: "Gómez",
        document_number: "123456",
        phone: "3001234567",
      },
      error: null,
    });

    const { data, error } = await getOwnProfile(supabase, "u1");

    expect(error).toBeNull();
    expect(data).toEqual({
      id: "u1",
      email: "user@test.com",
      firstName: "Ana",
      lastName: "Gómez",
      documentNumber: "123456",
      phone: "3001234567",
    });
  });

  it("returns null data when no row is found", async () => {
    const supabase = mockSupabase({ data: null, error: null });

    const { data, error } = await getOwnProfile(supabase, "missing");

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("wraps a Supabase error", async () => {
    const supabase = mockSupabase({ data: null, error: { message: "boom" } });

    const { data, error } = await getOwnProfile(supabase, "u1");

    expect(data).toBeNull();
    expect(error).toEqual(new Error("boom"));
  });
});
