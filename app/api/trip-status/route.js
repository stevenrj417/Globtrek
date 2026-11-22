import { tripConfirmations } from "../../lib/booking/confirmations.js";
import { isTripRef } from "../../lib/anyplace/trip.js";
import { sharedRateLimit } from "../../lib/security/rateLimit.js";

export const dynamic = "force-dynamic";

// Which parts of a trip Booking.com has reported as booked (through CJ), by the
// trip's random reference. Returns kinds only: { confirmed: { stay: true, ... } }.
export async function GET(request) {
  const limited = await sharedRateLimit(request, { name: "trip-status", limit: 30 });
  if (limited) return limited;
  const ref = new URL(request.url).searchParams.get("ref") || "";
  if (!isTripRef(ref)) return Response.json({ error: "Unknown trip." }, { status: 400 });
  try {
    const result = await tripConfirmations(ref);
    return Response.json(result, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    console.log(JSON.stringify({ level: "error", msg: "trip_status_failed", error: error.message }));
    return Response.json({ available: false, confirmed: {} }, { headers: { "Cache-Control": "no-store" } });
  }
}
