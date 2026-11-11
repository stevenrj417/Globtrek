import { destinations } from "../../../data/destinations";
import { SupabaseActivityProvider } from "../../../lib/inventory/SupabaseActivityProvider";
import { buildBudgetPlan } from "../../../lib/recommendation/budgetEngine";
import { normalizeTravelerProfile } from "../../../lib/recommendation/travelerProfile";
import { createClient } from "../../../lib/supabase/server";
import { GooglePlacesDiscoveryProvider } from "../../../lib/google-places/GooglePlacesDiscoveryProvider";
import { launchActivities } from "../../../data/launchSet";
import { withPlacePhotos } from "../../../lib/google-places/placePhotos";
import { curatedActivities } from "../../../lib/recommendation/eligibility";
import { rateLimit } from "../../../lib/security/rateLimit";

export async function POST(request) {
  const limited = rateLimit(request, { name: "activities", limit: 40 });
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  if (typeof body.destinationId !== "string" || body.destinationId.length > 80) return Response.json({ error: "Unknown destination" }, { status: 400 });
  const destination = destinations.find((item) => (item.id || item.airport) === body.destinationId);
  if (!destination) return Response.json({ error: "Unknown destination" }, { status: 400 });
  // Launch destinations show only hand-verified activities.
  const verified = launchActivities(destination.id);
  if (verified.length) return Response.json({ activities: await withPlacePhotos(verified), source: "globtrek_launch_verified", isLive: false });
  // Then the curated list checked against Google Places for this destination.
  const curated = curatedActivities(destination.id || destination.airport);
  if (curated.length) return Response.json({ activities: await withPlacePhotos(curated.slice(0, 12)), source: "globtrek_curated_google_places", isLive: false });
  try {
    const profile = normalizeTravelerProfile(body.quiz || {});
    const budgetPlan = buildBudgetPlan(profile, destination);
    let activities = [];
    let source = "supabase_verified";
    try { activities = await new SupabaseActivityProvider(await createClient()).searchActivities({ destinationId: destination.id || destination.airport, profile, budgetPlan, context: {}, limit: 12 }); }
    catch (error) { console.warn("Activity catalog unavailable; using verified place discovery.", error instanceof Error ? error.message : "unknown"); }
    if (!activities.length && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      activities = await new GooglePlacesDiscoveryProvider().discoverActivities(destination, { limit: 12 });
      source = "google_places_verified";
    }
    // Rock bottom leads with the destination's free highlights.
    if (budgetPlan.spendStyle === "cheapest" && destination.freeHighlights?.length) {
      const free = destination.freeHighlights.map((name, index) => ({ id: `${destination.id || destination.airport}-free-${index}`, destinationId: destination.id || destination.airport, name, description: "Free", category: "free", isFree: true, estimatedCostLow: 0, estimatedCostHigh: 0, provider: "official", googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${destination.city}`)}`, detailsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${destination.city}`)}`, imageUrl: null }));
      activities = [...free, ...activities.filter((activity) => !free.some((item) => item.name === activity.name))];
    }
    return Response.json({ activities: await withPlacePhotos(activities.slice(0, 12)), source, isLive: false });
  } catch (error) {
    console.warn("Verified activity catalog unavailable.", error instanceof Error ? error.message : "unknown");
    return Response.json({ activities: [], source: "unavailable", isLive: false });
  }
}
