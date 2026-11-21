import { createPlacesClient, DESTINATION_FIELDS } from "../../../lib/anyplace/google";
import { destinationFrom, computePicks } from "../../../lib/anyplace/picks";
import { hydrate } from "../../../lib/anyplace/service";
import { featuredSlug } from "../../../lib/anyplace/featured";
import { createCjClient } from "../../../lib/catalog/cjClient";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Preview-only test harness: builds picks for a place from scratch (ignoring the
// featured-page redirect and the saved picks) and returns them as JSON with fresh
// Google details. Never available on production.
//   GET /api/internal/place-picks?q=Tiradentes, Brazil
export async function GET(request) {
  if (process.env.VERCEL_ENV === "production") return Response.json({ error: "Not found" }, { status: 404 });
  const params = new URL(request.url).searchParams;
  const places = createPlacesClient();
  const logs = [];
  let placeId = params.get("placeId");
  if (!placeId && params.get("q")) placeId = (await places.autocomplete(params.get("q"), { sessionToken: `test${Date.now()}` }))[0]?.placeId;
  if (!placeId) return Response.json({ error: "no place" }, { status: 400 });
  const destination = destinationFrom(await places.details(placeId, DESTINATION_FIELDS));
  const started = Date.now();
  const ranked = [];
  const all = await computePicks({ places, cj: createCjClient({ minIntervalMs: 250, timeoutMs: 15000, maxAttempts: 2 }), destination, log: (entry) => logs.push(entry), debug: params.get("debug") ? (entry) => ranked.push(entry) : null });
  const computeMs = Date.now() - started;
  const shown = {};
  for (const [budget, picks] of Object.entries(all)) shown[budget] = await hydrate(picks, places, { photos: false });
  return Response.json({ destination: { ...destination, featured: featuredSlug(destination) }, computeMs, googleCalls: places.stats().calls, logs, ranked, picks: shown }, { headers: { "Cache-Control": "no-store" } });
}
