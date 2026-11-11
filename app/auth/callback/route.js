import { NextResponse } from "next/server";
import { safeNextPath } from "../../lib/security/redirects";
import { createClient } from "../../lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") || "/";
  const next = safeNextPath(requestedNext);
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
