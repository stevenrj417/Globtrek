// Booking.com Demand API (v3.1) exact-stay quotes. Server-only.
//
// POST /accommodations/availability (one property) and
// /accommodations/bulk-availability (up to 50) return, per product, a price
// with `book` (what must be shown to the traveller), `total` (book plus
// excluded charges) and, when extras include "extra_charges", the included,
// excluded and conditional charges; cancellation and meal-plan policies come
// with each product.
//
// Needs BOOKING_DEMAND_API_TOKEN and BOOKING_AFFILIATE_ID. Without them every
// call answers { configured: false } and nothing is invented.
//
// Booking.com asks partners not to keep availability prices long, so storing
// a quote as a price observation is off unless BOOKING_DEMAND_STORE_QUOTES is
// "true" (set it only once the partner agreement allows it).

const BASE = process.env.BOOKING_DEMAND_API_BASE || "https://demandapi.booking.com/3.1";
const MAX_BULK = 50;
const DAY = 86400000;

export function demandConfigured(env = process.env) {
  return Boolean(env.BOOKING_DEMAND_API_TOKEN && /^\d+$/.test(env.BOOKING_AFFILIATE_ID || ""));
}

export function mayStoreQuotes(env = process.env) {
  return env.BOOKING_DEMAND_STORE_QUOTES === "true";
}

export function validStay({ checkIn, checkOut, today = new Date().toISOString().slice(0, 10) }) {
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  const nights = (end - start) / DAY;
  return Number.isFinite(nights) && start >= now && (start - now) / DAY <= 500 && nights >= 1 && nights <= 90;
}

export function availabilityBody({ ids, checkIn, checkOut, adults, rooms = 1, currency = "USD", country = "us" }) {
  const body = {
    booker: { country, platform: "desktop" },
    checkin: checkIn,
    checkout: checkOut,
    currency,
    extras: ["extra_charges"],
    guests: { number_of_adults: adults, number_of_rooms: rooms },
  };
  return ids.length === 1 ? { ...body, accommodation: Number(ids[0]) } : { ...body, accommodations: ids.map(Number) };
}

const sum = (charges = []) => charges.reduce((total, charge) => total + (Number(charge.total_amount) || 0), 0);

// The cheapest product that sleeps the party, in GlobTrek's quote shape.
export function cheapestQuote(entry, { checkIn, checkOut, adults, rooms = 1, quotedAt }) {
  const products = (entry?.products || []).filter((product) => Number(product?.price?.book) > 0 && (Number(product.maximum_occupancy?.adults ?? product.maximum_occupancy?.total) || 0) * rooms >= adults);
  if (!products.length || !/^[A-Z]{3}$/.test(entry.currency || "")) return null;
  const best = products.sort((a, b) => a.price.total - b.price.total || a.price.book - b.price.book)[0];
  const excluded = sum(best.price.extra_charges?.excluded);
  return {
    provider: "booking.com",
    accommodationId: String(entry.id),
    productId: best.id || null,
    roomId: best.room ?? null,
    checkIn,
    checkOut,
    adults,
    rooms,
    currency: entry.currency,
    // book is the display price; total adds charges paid at the property.
    displayPrice: Number(best.price.book),
    total: Number(best.price.total) || Number(best.price.book) + excluded,
    taxesIncluded: true,
    taxesAndFees: sum(best.price.extra_charges?.included) + excluded,
    conditionalCharges: (best.price.extra_charges?.conditional || []).length,
    refundable: best.policies?.cancellation?.type ? best.policies.cancellation.type === "free_cancellation" : null,
    freeCancellationUntil: best.policies?.cancellation?.free_cancellation_until || null,
    mealPlan: best.policies?.meal_plan?.plan || null,
    deepLink: entry.deep_link_url || entry.url || null,
    quotedAt,
  };
}

async function post(path, body, { env, fetchImpl }) {
  const response = await fetchImpl(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.BOOKING_DEMAND_API_TOKEN}`, "X-Affiliate-Id": env.BOOKING_AFFILIATE_ID, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(`booking_demand_${response.status}`), { status: response.status });
  return payload;
}

// Exact-date quotes for up to 50 properties at once: { configured, quotes: { id: quote|null } }.
export async function quoteStays({ ids, checkIn, checkOut, adults, rooms = 1, currency = "USD", env = process.env, fetchImpl = fetch, now = new Date() }) {
  if (!demandConfigured(env)) return { configured: false, quotes: {} };
  const unique = [...new Set(ids.map(String).filter((id) => /^\d+$/.test(id)))];
  if (!unique.length || !validStay({ checkIn, checkOut, today: now.toISOString().slice(0, 10) })) return { configured: true, quotes: {} };
  const quotedAt = now.toISOString();
  const quotes = Object.fromEntries(unique.map((id) => [id, null]));
  for (let index = 0; index < unique.length; index += MAX_BULK) {
    const chunk = unique.slice(index, index + MAX_BULK);
    const payload = await post(chunk.length === 1 ? "/accommodations/availability" : "/accommodations/bulk-availability", availabilityBody({ ids: chunk, checkIn, checkOut, adults, rooms, currency }), { env, fetchImpl });
    const entries = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [];
    for (const entry of entries) quotes[String(entry.id)] = cheapestQuote(entry, { checkIn, checkOut, adults, rooms, quotedAt });
  }
  return { configured: true, quotes };
}

// A quote as a price observation (only stored when mayStoreQuotes()).
export function quoteObservation(quote, { itemId, destinationId }) {
  const nights = Math.round((Date.parse(`${quote.checkOut}T00:00:00Z`) - Date.parse(`${quote.checkIn}T00:00:00Z`)) / DAY);
  return {
    kind: "stay",
    itemId,
    destinationId,
    provider: "booking.com",
    source: "demand_api_availability",
    observedAt: quote.quotedAt.slice(0, 10),
    travelDate: quote.checkIn,
    travelEnd: quote.checkOut,
    price: Math.round((quote.total / nights / quote.rooms) * 100) / 100,
    currency: quote.currency,
    unit: "per_night",
    taxesIncluded: true,
    occupancy: Math.ceil(quote.adults / quote.rooms),
    roomType: quote.roomId != null ? `room:${quote.roomId}` : null,
    conditions: { refundable: quote.refundable, mealPlan: quote.mealPlan, totalPrice: quote.total, nights, taxesAndFees: quote.taxesAndFees },
  };
}
