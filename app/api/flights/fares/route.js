import { travelpayoutsConfig } from "../../../lib/travelpayouts/client.js";
import { recentFares } from "../../../lib/travelpayouts/fares.js";
import { partnerUrls } from "../../../lib/travelpayouts/partnerCache.js";
import { sharedRateLimit } from "../../../lib/security/rateLimit.js";

export const dynamic = "force-dynamic";

// Recently seen round-trip fares for the traveler's route, from the Aviasales
// cache. Not live prices: each response says so and when it was checked.

const IATA = /^[A-Z]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;
const cache = new Map();
const TTL = 30 * 60000;

export async function GET(request) {
  const limited = await sharedRateLimit(request, { name: "flight-fares", limit: 30 });
  if (limited) return limited;
  const params = new URL(request.url).searchParams;
  const origin = String(params.get("origin") || "").toUpperCase();
  const destination = String(params.get("destination") || "").toUpperCase();
  const depart = params.get("depart") || "";
  const ret = params.get("return") || "";
  const months = String(params.get("months") || "").split(",").filter((month) => MONTH.test(month)).slice(0, 3);
  const nights = Math.min(30, Math.max(1, Number.parseInt(params.get("nights"), 10) || 5));
  const adults = Math.min(9, Math.max(1, Number.parseInt(params.get("adults"), 10) || 1));
  if (!IATA.test(origin) || !IATA.test(destination) || origin === destination) return Response.json({ error: "Choose a departure airport and destination." }, { status: 400 });
  if ((depart || ret) && !(DATE.test(depart) && DATE.test(ret) && ret > depart)) return Response.json({ error: "Dates must be YYYY-MM-DD with return after departure." }, { status: 400 });
  if (!depart && !months.length) return Response.json({ error: "Give travel dates or months." }, { status: 400 });

  const { token } = travelpayoutsConfig();
  const headers = { "Cache-Control": "private, max-age=600" };
  if (!token) return Response.json({ available: false, fares: [], reason: "not_configured" }, { headers });
  const key = [origin, destination, depart, ret, months.join(","), nights, adults].join("|");
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return Response.json(hit.body, { headers });
  try {
    const fares = await recentFares({ token, origin, destination, depart, ret, months, nights, adults });
    const links = await partnerUrls(fares.map((fare) => fare.searchUrl), { subId: "fares" });
    const body = {
      available: true,
      checkedAt: new Date().toISOString(),
      source: "Aviasales search cache (fares travelers found in the last 48 hours, cached up to 7 days)",
      live: false,
      fares: fares.map((fare, index) => ({
        departDate: fare.departDate, returnDate: fare.returnDate, roundTrip: true, exactDates: fare.exactDates,
        pricePerPerson: fare.pricePerPerson, groupTotal: fare.groupTotal, adults: fare.adults, currency: fare.currency,
        stops: fare.stops, airline: fare.airline, otherAirport: fare.otherAirport, otherReturnAirport: fare.otherReturnAirport,
        bookingUrl: links[index].partnerUrl || fare.searchUrl, attributed: Boolean(links[index].partnerUrl),
      })),
    };
    cache.set(key, { body, expires: Date.now() + TTL });
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    return Response.json(body, { headers });
  } catch (error) {
    console.log(JSON.stringify({ level: "warn", msg: "fares_unavailable", code: error?.code || "error" }));
    return Response.json({ available: false, fares: [], reason: "provider_unavailable" }, { headers: { "Cache-Control": "no-store" } });
  }
}
