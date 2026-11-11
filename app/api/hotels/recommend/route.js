import { NextResponse } from "next/server";
import { destinations } from "../../../data/destinations.js";
import { SupabaseCuratedHotelProvider } from "../../../lib/inventory/SupabaseCuratedHotelProvider.js";
import { CjCatalogHotelProvider } from "../../../lib/inventory/CjCatalogHotelProvider.js";
import { BookingComDemandHotelProvider } from "../../../lib/inventory/BookingComDemandHotelProvider.js";
import { buildBudgetPlan } from "../../../lib/recommendation/budgetEngine.js";
import { buildStayShortlist } from "../../../lib/recommendation/stayShortlist.js";
import { normalizeTravelerProfile } from "../../../lib/recommendation/travelerProfile.js";
import { createClient } from "../../../lib/supabase/server.js";
import { verifiedStays } from "../../../data/launchSet.js";
import { sharedRateLimit } from "../../../lib/security/rateLimit";

export const runtime = "nodejs";

// Stay shortlist for a trip: hand-verified stays, the Booking.com catalog from CJ,
// and curated hotels, ranked into Our pick / Best value / Upgrade. Catalog data is
// property details only; no live rates exist until the Demand API is connected.
export async function POST(request) {
  const limited = await sharedRateLimit(request, { name: "hotels", limit: 40 });
  if (limited) return limited;
  try {
    const body = await request.json();
    const destination = destinations.find((item) => (item.id || item.airport) === body.destinationId);
    if (!destination) return NextResponse.json({ error: "Unknown destination" }, { status: 400 });
    const quizProfile = normalizeTravelerProfile(body.quiz || {});
    const budgetPlan = buildBudgetPlan(quizProfile, destination);
    // The style the budget engine actually planned (it may have chosen it from the budget).
    const profile = { ...quizProfile, spendStyle: budgetPlan.spendStyle };
    let supabase = null;
    try { supabase = await createClient(); } catch {}
    const curatedSearch = supabase
      ? new SupabaseCuratedHotelProvider(supabase).searchHotels({ destination, profile, budgetPlan, limit: 12 })
        .then((hotels) => hotels.filter((hotel) => hotel.bookingUrl && (Number(hotel.starRating) || 0) <= 4 && !["premium", "luxury"].includes(hotel.priceTier)).map((hotel) => ({ ...hotel, source: "curated", dataUpdatedAt: hotel.verifiedAt })))
        .catch(() => [])
      : Promise.resolve([]);
    const [catalog, curated] = await Promise.all([new CjCatalogHotelProvider({ supabase }).listProperties(destination.id), curatedSearch]);
    const candidates = [...verifiedStays(destination.id), ...catalog.properties.map((property) => ({ ...property, source: "catalog", dataUpdatedAt: property.importedAt })), ...curated];
    const { choices, notice, considered } = buildStayShortlist({ candidates, profile, destination, budgetPlan, accessibleOnly: Boolean(body.accessibleOnly) });
    return NextResponse.json({
      hotels: choices.map((choice) => ({ ...choice, type: "hotel", provider: "booking.com", providerLinkVerified: true, image: choice.image || choice.photos?.[0] || null })),
      notice,
      considered,
      catalog: { source: catalog.source, checkedAt: catalog.checkedAt },
      liveRates: BookingComDemandHotelProvider.isConfigured(),
      budget: { month: budgetPlan.lodging.month, perNight: budgetPlan.lodging.perNight, unit: budgetPlan.lodging.unit, units: budgetPlan.lodging.units, nights: budgetPlan.lodging.nights, total: budgetPlan.lodging.total, priceKind: budgetPlan.lodging.priceKind, name: budgetPlan.lodging.name },
    });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "hotel_recommendations_failed", error: String(error?.message || "unknown").slice(0, 200) }));
    return NextResponse.json({ error: "Hotel recommendations are temporarily unavailable" }, { status: 503 });
  }
}
