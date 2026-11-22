import { createPlacesClient } from "../../lib/anyplace/google";
import { searchStays } from "../../lib/search/stays";
import { sharedRateLimit } from "../../lib/security/rateLimit";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
// Things people book or visit: sights, museums, parks, theme parks, landmarks.
const ACTIVITY_TYPES = ["tourist_attraction", "museum", "amusement_park", "park", "historical_landmark"];

// GET /api/search?q=…&s=<session token>
// Hotels come from GlobTrek's Booking.com catalog; things to do from Google Maps
// through our server (the key never reaches the browser, and nothing is stored).
export async function GET(request) {
  const limited = await sharedRateLimit(request, { name: "site-search", limit: 120 });
  if (limited) return limited;
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") || "").trim().slice(0, 80);
  const sessionToken = (params.get("s") || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  if (q.length < 3) return Response.json({ hotels: [], activities: [] }, { headers: NO_STORE });
  const hotels = searchStays(q, 6);
  let activities = [];
  if (sessionToken) {
    try {
      activities = (await createPlacesClient().autocomplete(q, { sessionToken, types: ACTIVITY_TYPES })).slice(0, 5);
    } catch (error) {
      console.log(JSON.stringify({ level: "warn", msg: "activity_search_failed", error: error.message }));
    }
  }
  return Response.json({ hotels, activities }, { headers: NO_STORE });
}
