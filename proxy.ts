import type { NextRequest } from "next/server";

import { updateSession } from "@/shared/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Skip proxy for Server Action POSTs: middleware redirects break the RSC action response
// ("An unexpected response was received from the server"). Auth is enforced inside each action.
export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [{ type: "header", key: "next-action" }],
    },
  ],
};
