import { describe, it, expect, vi, beforeEach } from "vitest";

import { syncProfileNameToAuthMetadata } from "../lib/sync-profile-name-to-auth-metadata";

function createMockAdminClient(options: {
  profile?: { id: string; full_name: string | null } | null;
  profileError?: { message: string } | null;
  userMetadata?: Record<string, unknown>;
  getUserError?: { message: string } | null;
}) {
  const updateUserById = vi.fn().mockResolvedValue({ data: {}, error: null });
  const getUserById = vi.fn().mockResolvedValue({
    data: {
      user:
        options.getUserError !== undefined && options.getUserError !== null
          ? null
          : {
              id: options.profile?.id ?? "user-id",
              user_metadata: options.userMetadata ?? {},
            },
    },
    error: options.getUserError ?? null,
  });

  const maybeSingle = vi.fn().mockResolvedValue({
    data: options.profile ?? null,
    error: options.profileError ?? null,
  });

  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    client: {
      from,
      auth: {
        admin: {
          getUserById,
          updateUserById,
        },
      },
    },
    updateUserById,
    getUserById,
    from,
  };
}

describe("syncProfileNameToAuthMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates user_metadata when profile has full_name and metadata is missing", async () => {
    const { client, updateUserById } = createMockAdminClient({
      profile: { id: "11111111-1111-1111-1111-111111111111", full_name: "María López" },
      userMetadata: {},
    });

    await syncProfileNameToAuthMetadata(client as never, "maria@ips.com");

    expect(updateUserById).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111", {
      user_metadata: { full_name: "María López" },
    });
  });

  it("skips update when full_name already matches metadata", async () => {
    const { client, updateUserById } = createMockAdminClient({
      profile: { id: "11111111-1111-1111-1111-111111111111", full_name: "María López" },
      userMetadata: { full_name: "María López" },
    });

    await syncProfileNameToAuthMetadata(client as never, "maria@ips.com");

    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("does nothing when profile is not found", async () => {
    const { client, updateUserById } = createMockAdminClient({ profile: null });

    await syncProfileNameToAuthMetadata(client as never, "unknown@ips.com");

    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("does nothing when profile full_name is empty", async () => {
    const { client, updateUserById } = createMockAdminClient({
      profile: { id: "11111111-1111-1111-1111-111111111111", full_name: "   " },
    });

    await syncProfileNameToAuthMetadata(client as never, "user@ips.com");

    expect(updateUserById).not.toHaveBeenCalled();
  });
});
