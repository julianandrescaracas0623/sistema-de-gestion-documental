import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con **service role**. Solo importar desde Server Actions / Route Handlers.
 * Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || url === "" || key === undefined || key === "") {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
