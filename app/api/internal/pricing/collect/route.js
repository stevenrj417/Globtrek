import { latestPrices, travelpayoutsConfig } from "../../../../lib/travelpayouts/client.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Price collection for the observation store. Preview deployments only (behind
// Vercel deployment protection); production returns 404. It returns provider
// observations in GlobTrek's shape for scripts/pricing to save; it never
// returns credentials.
//
// GET ?kind=flights&origin=LAX&pages=3
//   Round-trip economy fares Aviasales users found from the origin, any
//   destination, for travel in the coming year. Each fare keeps the day it was
//   found (observedAt) apart from the day it departs (travelDate).

export async function GET(request) {
  if (process.env.VERCEL_ENV !== "preview") return new Response("Not found", { status: 404 });
  const params = new URL(request.url).searchParams;
  const { token } = travelpayoutsConfig();
  if (params.get("kind") !== "flights") return Response.json({ error: "unknown kind" }, { status: 400 });
  const origin = String(params.get("origin") || "").toUpperCase();
  const pages = Math.min(5, Math.max(1, Number(params.get("pages")) || 1));
  const rows = [];
  const errors = [];
  for (let page = 1; page <= pages; page += 1) {
    try {
      const fares = await latestPrices({ token, origin, periodType: "year", oneWay: false, limit: 1000, page, affiliateOnly: false });
      for (const fare of fares) {
        if (!fare.roundTrip || !fare.departDate || !fare.returnDate || !fare.foundAt) continue;
        rows.push({
          kind: "flight",
          itemId: `${fare.originAirport || origin}-${fare.destinationAirport}`,
          origin: fare.originAirport || origin,
          destination: fare.destinationAirport,
          provider: "aviasales",
          source: "aviasales_data_api_v3_get_latest_prices",
          observedAt: fare.foundAt.slice(0, 10),
          travelDate: fare.departDate,
          travelEnd: fare.returnDate,
          price: fare.pricePerPerson,
          currency: fare.currency,
          unit: "per_passenger_round_trip",
          taxesIncluded: true,
          conditions: { cabin: "economy", stops: fare.stops, airline: fare.airline, durationMinutes: fare.durationMinutes },
        });
      }
      if (fares.length < 1000) break;
    } catch (error) {
      errors.push({ page, error: error?.code || "failed" });
      break;
    }
  }
  return Response.json({ kind: "flights", origin, collectedAt: new Date().toISOString(), count: rows.length, errors, rows }, { headers: { "Cache-Control": "no-store" } });
}
