import { createPlacesClient } from "../../../lib/anyplace/google";
import { sharedRateLimit } from "../../../lib/security/rateLimit";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// Place suggestions for the search box. The Google key stays on the server; the
// browser sends only what was typed and a session token it made up.
export async function GET(request) {
  const limited = await sharedRateLimit(request, { name: "places-autocomplete", limit: 120 });
  if (limited) return limited;
  const params = new URL(request.url).searchParams;
  const input = (params.get("q") || "").trim().slice(0, 80);
  const sessionToken = (params.get("s") || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  if (input.length < 2 || !sessionToken) return Response.json({ suggestions: [] }, { headers: NO_STORE });
  try {
    const suggestions = await createPlacesClient().autocomplete(input, { sessionToken });
    return Response.json({ suggestions: suggestions.slice(0, 5) }, { headers: NO_STORE });
  } catch (error) {
    console.log(JSON.stringify({ level: "warn", msg: "places_autocomplete_failed", error: error.message }));
    return Response.json({ suggestions: [], error: "unavailable" }, { status: 503, headers: NO_STORE });
  }
}
