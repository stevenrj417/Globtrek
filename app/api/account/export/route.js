import { createClient } from "../../../lib/supabase/server";

// Everything GlobTrek stores for the signed-in account, as one JSON download.
export async function GET() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth?.user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  const user = auth.user;
  const [profile, trips, saved, recent, searches] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("saved_trips").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("saved_items").select("*").eq("user_id", user.id),
    supabase.from("recent_views").select("*").eq("user_id", user.id),
    supabase.from("recent_searches").select("*").eq("user_id", user.id),
  ]);
  const body = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, createdAt: user.created_at, signInProvider: user.app_metadata?.provider || "email" },
    profile: profile.data || null,
    savedTrips: trips.data || [],
    savedItems: saved.data || [],
    recentlyViewed: recent.data || [],
    recentSearches: searches.data || [],
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="globtrek-data-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "private, no-store" } });
}
