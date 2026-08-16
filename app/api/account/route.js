import { createClient } from "../../lib/supabase/server";
import { createAdminClient } from "../../lib/supabase/admin";

const AIRPORT_RE = /^[A-Z]{3}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

export async function GET() {
  const { supabase, user } = await authenticatedClient();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const metadata = user.user_metadata || {};
  await supabase.from("profiles").upsert({
    id: user.id,
    display_name: metadata.full_name || metadata.name || user.email?.split("@")[0] || null,
    avatar_url: metadata.avatar_url || metadata.picture || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id", ignoreDuplicates: true });

  const [profileResult, tripsResult, savedResult, recentResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("saved_trips").select("*").order("updated_at", { ascending: false }),
    supabase.from("saved_items").select("*").order("updated_at", { ascending: false }),
    supabase.from("recent_views").select("*").order("viewed_at", { ascending: false }).limit(12),
  ]);
  const error = profileResult.error || tripsResult.error || savedResult.error || recentResult.error;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({
    user: { email: user.email, provider: user.app_metadata?.provider || "email" },
    profile: profileResult.data,
    trips: tripsResult.data || [],
    saved: savedResult.data || [],
    recent: recentResult.data || [],
  });
}

export async function PATCH(request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid profile" }, { status: 400 });

  const displayName = String(body.displayName || "").trim().slice(0, 100) || null;
  const homeAirport = String(body.homeAirport || "").trim().toUpperCase();
  const currency = String(body.currency || "USD").trim().toUpperCase();
  if (homeAirport && !AIRPORT_RE.test(homeAirport)) return Response.json({ error: "Use a three-letter airport code" }, { status: 400 });
  if (!CURRENCY_RE.test(currency)) return Response.json({ error: "Use a three-letter currency code" }, { status: 400 });

  const { data, error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName,
    home_airport: homeAirport || null,
    currency,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" }).select().single();
  return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ profile: data });
}

export async function DELETE(request) {
  const { user } = await authenticatedClient();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (body.confirmation !== "DELETE MY ACCOUNT") return Response.json({ error: "Confirmation phrase required" }, { status: 400 });
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error(error.message);
    return Response.json({ deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "account_delete_failed", error: error instanceof Error ? error.message : "unknown" }));
    return Response.json({ error: "Account deletion is temporarily unavailable." }, { status: 503 });
  }
}
