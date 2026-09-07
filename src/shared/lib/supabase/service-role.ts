import { createClient } from "@supabase/supabase-js";

import { publicEnv, requireServerEnv } from "@/shared/lib/env";

/**
 * Cliente Supabase con **service role**. Solo importar desde Server Actions / Route Handlers.
 * Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.
 */
export function createServiceRoleClient() {
  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
