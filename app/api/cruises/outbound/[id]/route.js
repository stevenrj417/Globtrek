import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

const placements = new Set(["match_card", "cruise_detail", "sticky_action", "itinerary"]);

export async function GET(request, { params }) {
  const { id } = await params;
  const placement = placements.has(request.nextUrl.searchParams.get("placement")) ? request.nextUrl.searchParams.get("placement") : "cruise_detail";
  try {
    const client = createAdminClient();
    const { data: cruise, error } = await client.from("cruise_catalog").select("id, provider, affiliate_url, affiliate_url_verified, recommendation_ready, active").eq("id", id).maybeSingle();
    if (error || !cruise?.active || !cruise.recommendation_ready || !cruise.affiliate_url_verified) return Response.json({ error: "Verified sailing link unavailable" }, { status: 404 });
    const destination = new URL(cruise.affiliate_url);
    if (destination.protocol !== "https:") return Response.json({ error: "Verified sailing link unavailable" }, { status: 404 });
    const referrer = request.headers.get("referer"); let referrerHost = null;
    try { referrerHost = referrer ? new URL(referrer).host : null; } catch {}
    const { error: trackingError } = await client.from("cruise_outbound_events").insert({ cruise_id: cruise.id, placement, provider: cruise.provider, referrer_host: referrerHost, user_agent_family: request.headers.get("user-agent")?.slice(0, 180) || null, metadata: { destinationHost: destination.host } });
    if (trackingError) console.error("Cruise outbound event was not recorded.", trackingError.code || "unknown");
    return Response.redirect(destination, 307);
  } catch (error) {
    console.error("Cruise outbound tracking unavailable.", error?.message);
    return Response.json({ error: "Verified sailing link unavailable" }, { status: 503 });
  }
}
