import { afterEach, describe, expect, it, vi } from "vitest";

import { publicSchema, requireServerEnv } from "@/shared/lib/env";

describe("publicSchema", () => {
  const valid = {
    NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    NEXT_PUBLIC_APP_URL: "https://docs.ips.example",
  };

  it("accepts a fully-populated config", () => {
    expect(publicSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing NEXT_PUBLIC_APP_URL", () => {
    const result = publicSchema.safeParse({ ...valid, NEXT_PUBLIC_APP_URL: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects a non-URL NEXT_PUBLIC_SUPABASE_URL", () => {
    const result = publicSchema.safeParse({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/URL válida/i);
    }
  });

  it("rejects an empty anon key", () => {
    expect(publicSchema.safeParse({ ...valid, NEXT_PUBLIC_SUPABASE_ANON_KEY: "" }).success).toBe(false);
  });
});

describe("requireServerEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the value when the secret is set", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    expect(requireServerEnv("SUPABASE_SERVICE_ROLE_KEY")).toBe("service-key");
  });

  it("throws a clear error when the secret is missing", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() => requireServerEnv("SUPABASE_SERVICE_ROLE_KEY")).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY/
    );
  });
});
