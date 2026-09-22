import type { createClient } from "@/shared/lib/supabase/server";

export type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export interface OwnProfileRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  documentNumber: string | null;
  phone: string | null;
}

/** Reads the caller's own profile row; visibility enforced by RLS (self-or-admin). */
export async function getOwnProfile(
  supabase: SupabaseServer,
  userId: string
): Promise<{ data: OwnProfileRow | null; error: Error | null }> {
  interface RawRow {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    document_number: string | null;
    phone: string | null;
  }

  const { data: rawData, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, document_number, phone")
    .eq("id", userId)
    .maybeSingle();
  const data: RawRow | null = rawData;

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }
  if (data === null) {
    return { data: null, error: null };
  }

  return {
    data: {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      documentNumber: data.document_number,
      phone: data.phone,
    },
    error: null,
  };
}
