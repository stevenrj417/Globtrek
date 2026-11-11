import { createAdminClient } from "../../../lib/supabase/admin";
import { sharedRateLimit } from "../../../lib/security/rateLimit";

const NOT_FOUND = () => Response.json({ error: "Trip not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

// A shared trip, readable by anyone with its link until it expires or is revoked.
// Only the plan is returned: never the owner's id, email or sharing settings.
export async function GET(request, { params }) {
  const limited = await sharedRateLimit(request, { name: "public-trip", limit: 60 });
  if (limited) return limited;
  const { slug } = await params;
  if (!/^s_[A-Za-z0-9_-]{20,40}$/.test(slug)) return NOT_FOUND();
  try {
    const { data, error } = await createAdminClient().from("saved_trips").select("id,destination_name,destination_country,trip_data,updated_at").eq("public_slug", slug).eq("is_public", true).maybeSingle();
    if (error || !data) return NOT_FOUND();
    const expiresAt = data.trip_data?._share?.expiresAt;
    if (expiresAt && Date.parse(expiresAt) <= Date.now()) return Response.json({ error: "This shared trip link has expired." }, { status: 410, headers: { "Cache-Control": "no-store" } });
    const { _share, ...tripData } = data.trip_data || {};
    void _share;
    return Response.json({ trip: { destination_name: data.destination_name, destination_country: data.destination_country, trip_data: tripData, updated_at: data.updated_at }, expiresAt: expiresAt || null }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch {
    return Response.json({ error: "Public trips are unavailable" }, { status: 503 });
  }
}
