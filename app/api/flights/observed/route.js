import { observedFare, prefetchObservedFares } from "../../../lib/pricing/observedFares.js";
import { sharedRateLimit } from "../../../lib/security/rateLimit.js";

export const dynamic = "force-dynamic";

// The average of round-trip fares Aviasales travelers found for one route and
// travel period, from GlobTrek's own observations. Not a live price: the
// response carries how many fares it averages and when they were seen.

const IATA = /^[A-Z]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request) {
  const limited = await sharedRateLimit(request, { name: "flight-observed", limit: 60 });
  if (limited) return limited;
  const params = new URL(request.url).searchParams;
  const origin = String(params.get("origin") || "").toUpperCase();
  const destination = String(params.get("destination") || "").toUpperCase();
  const depart = params.get("depart") || null;
  const months = String(params.get("months") || "").split(",").map(Number).filter((month) => month >= 1 && month <= 12).slice(0, 12);
  if (!IATA.test(origin) || !IATA.test(destination) || origin === destination) return Response.json({ error: "Choose a departure airport and destination." }, { status: 400 });
  if (depart && !DATE.test(depart)) return Response.json({ error: "Dates must be YYYY-MM-DD." }, { status: 400 });
  await prefetchObservedFares(origin);
  const fare = observedFare({ origin, destination, departDate: depart, months });
  return Response.json({ fare: fare || null }, { headers: { "Cache-Control": "public, max-age=1800" } });
}
