import { createPlacesClient } from "../../lib/anyplace/google";
import { searchStays } from "../../lib/search/stays";
import { sharedRateLimit } from "../../lib/security/rateLimit";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
// Things people book or visit: sights, museums, parks, theme parks, landmarks.
const ACTIVITY_TYPES = ["tourist_attraction", "museum", "amusement_park", "park", "historical_landmark"];
// Paid Google lookups added 2026-11-22, switched off the same day at the owner's
// request (cost per search): the landmark text search and the worldwide hotel
// autocomplete. Set to true to bring them back.
const EXTRA_GOOGLE_SEARCH = false;

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
  let moreHotels = [];
  if (sessionToken) {
    const places = createPlacesClient();
    // Any hotel in the world: Google's lodging search fills in what the catalog
    // doesn't have, and its page sends the traveler to that hotel on Booking.com.
    // Autocomplete leans toward places near our server, so "Christ the Redeemer"
    // finds a ballpark in New Jersey. Text search ranks by fame: its top three
    // come first, so the world's landmarks show up for everyone.
    const [famous, found, lodging] = await Promise.allSettled([
      EXTRA_GOOGLE_SEARCH && q.length >= 4 ? places.text({ textQuery: q, includedType: "tourist_attraction", max: 3, fieldMask: "places.id,places.displayName,places.formattedAddress" }) : Promise.resolve([]),
      places.autocomplete(q, { sessionToken, types: ACTIVITY_TYPES }),
      !EXTRA_GOOGLE_SEARCH || hotels.length >= 4 ? Promise.resolve([]) : places.autocomplete(q, { sessionToken, types: ["lodging"] }),
    ]);
    const top = famous.status === "fulfilled" ? famous.value.filter((place) => place.id && place.displayName?.text).map((place) => ({ placeId: place.id, name: place.displayName.text, detail: place.formattedAddress || "" })) : [];
    const seen = new Set(top.map((item) => item.placeId));
    if (found.status !== "fulfilled") console.log(JSON.stringify({ level: "warn", msg: "activity_search_failed", error: found.reason?.message }));
    activities = [...top, ...(found.status === "fulfilled" ? found.value.filter((item) => !seen.has(item.placeId)) : [])].slice(0, 6);
    if (lodging.status === "fulfilled") {
      const known = new Set(hotels.map((item) => item.name.toLowerCase()));
      moreHotels = lodging.value.filter((item) => !known.has(item.name.toLowerCase())).slice(0, 6 - Math.min(hotels.length, 6));
    }
  }
  return Response.json({ hotels, moreHotels, activities }, { headers: NO_STORE });
}
