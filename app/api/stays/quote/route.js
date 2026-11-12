import { quoteStays } from "../../../lib/pricing/bookingDemand";
import { sharedRateLimit } from "../../../lib/security/rateLimit";

// Exact-date Booking.com prices for specific properties. Answers
// { configured: false } until the Demand API is connected; the page then keeps
// its labeled estimate. Prices are returned, never stored here.
export async function POST(request) {
  const limited = await sharedRateLimit(request, { name: "stay-quote", limit: 30 });
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.slice(0, 50) : [];
  const adults = Math.max(1, Math.min(30, Number(body.adults) || 2));
  const rooms = Math.max(1, Math.min(30, Number(body.rooms) || Math.ceil(adults / 2)));
  if (!ids.length || !/^\d{4}-\d{2}-\d{2}$/.test(body.checkIn || "") || !/^\d{4}-\d{2}-\d{2}$/.test(body.checkOut || "")) return Response.json({ error: "Properties and dates are required." }, { status: 400 });
  try {
    const result = await quoteStays({ ids, checkIn: body.checkIn, checkOut: body.checkOut, adults, rooms });
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error(JSON.stringify({ level: "warn", msg: "stay_quote_failed", status: error?.status || null }));
    return Response.json({ configured: true, quotes: {}, error: "Live prices are unavailable right now." }, { status: 200 });
  }
}
