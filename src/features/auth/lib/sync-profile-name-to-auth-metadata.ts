import type { SupabaseClient } from "@supabase/supabase-js";

function readProfileName(profile: { id: unknown; full_name: unknown }): { id: string; fullName: string } | null {
  if (typeof profile.id !== "string" || typeof profile.full_name !== "string") {
    return null;
  }
  const fullName = profile.full_name.trim();
  if (fullName === "") {
    return null;
  }
  return { id: profile.id, fullName };
}

/**
 * Copies profiles.full_name into auth.users.user_metadata so Supabase email
 * templates can greet the user with {{ .Data.full_name }}.
 */
export async function syncProfileNameToAuthMetadata(
  adminClient: SupabaseClient,
  email: string,
): Promise<void> {
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, full_name")
    .eq("email", email)
    .maybeSingle();

  if (profileError !== null || profile === null) {
    return;
  }

  const parsed = readProfileName(profile);
  if (parsed === null) {
    return;
  }

  const { data: authUser, error: getUserError } =
    await adminClient.auth.admin.getUserById(parsed.id);

  if (getUserError !== null) {
    return;
  }

  const userMetadata = authUser.user.user_metadata;
  const rawName: unknown = "full_name" in userMetadata ? userMetadata.full_name : undefined;
  const existingName = typeof rawName === "string" ? rawName : undefined;
  if (typeof existingName === "string" && existingName.trim() === parsed.fullName) {
    return;
  }

  await adminClient.auth.admin.updateUserById(parsed.id, {
    user_metadata: { full_name: parsed.fullName },
  });
}
