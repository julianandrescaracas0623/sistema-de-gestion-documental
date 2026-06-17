import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createRouteHandlerClient } from "@/shared/lib/supabase/route-handler-client";

function sanitizeNext(rawNext: string | null): string {
  const next = rawNext ?? "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = sanitizeNext(searchParams.get("next"));

  if (code !== null && code !== "") {
    const successUrl = `${origin}${next}`;
    const { supabase, getResponse } = await createRouteHandlerClient(successUrl);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error !== null) {
      return NextResponse.redirect(`${origin}/login?error=auth_error`);
    }

    return getResponse();
  }

  if (tokenHash !== null && tokenHash !== "" && type !== null && type !== "") {
    const successUrl = `${origin}${next}`;
    const { supabase, getResponse } = await createRouteHandlerClient(successUrl);
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });

    if (error !== null) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/forgot-password?error=expired`);
      }
      return NextResponse.redirect(`${origin}/login?error=auth_error`);
    }

    return getResponse();
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
