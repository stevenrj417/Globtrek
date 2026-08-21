import { destinations } from "../../../data/destinations";
import { SupabaseActivityProvider } from "../../../lib/inventory/SupabaseActivityProvider";
import { buildBudgetPlan } from "../../../lib/recommendation/budgetEngine";
import { normalizeTravelerProfile } from "../../../lib/recommendation/travelerProfile";
import { createClient } from "../../../lib/supabase/server";
import { GooglePlacesDiscoveryProvider } from "../../../lib/google-places/GooglePlacesDiscoveryProvider";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const destination = destinations.find((item) => (item.id || item.airport) === body.destinationId);
  if (!destination) return Response.json({ error: "Unknown destination" }, { status: 400 });
  try {
    const profile = normalizeTravelerProfile(body.quiz || {});
    const budgetPlan = buildBudgetPlan(profile, destination);
    let activities = [];
    let source = "supabase_verified";
    try { activities = await new SupabaseActivityProvider(await createClient()).searchActivities({ destinationId: destination.id || destination.airport, profile, budgetPlan, context: {}, limit: 12 }); }
    catch (error) { console.warn("Activity catalog unavailable; using verified place discovery.", error instanceof Error ? error.message : "unknown"); }
    if (!activities.length && process.env.GOOGLE_PLACES_API_KEY) {
      activities = await new GooglePlacesDiscoveryProvider().discoverActivities(destination, { limit: 12 });
      source = "google_places_verified";
    }
    return Response.json({ activities, source, isLive: false });
  } catch (error) {
    console.warn("Verified activity catalog unavailable.", error instanceof Error ? error.message : "unknown");
    return Response.json({ activities: [], source: "unavailable", isLive: false });
  }
}
