import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface RouteHandlerClientResult {
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- @supabase/ssr createServerClient
  supabase: ReturnType<typeof createServerClient>;
  getResponse: () => NextResponse;
}

/**
 * Supabase client for Route Handlers that must attach session cookies to redirects.
 */
export async function createRouteHandlerClient(
  redirectUrl: string,
): Promise<RouteHandlerClientResult> {
  const cookieStore = await cookies();
  let response = NextResponse.redirect(redirectUrl);

  // eslint-disable-next-line @typescript-eslint/no-deprecated -- same @supabase/ssr pattern as middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
          response = NextResponse.redirect(redirectUrl);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Supabase SSR client typing
    supabase,
    getResponse: () => response,
  };
}
