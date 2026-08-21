import { NextResponse } from "next/server";
import { destinations } from "../../../data/destinations.js";
import { SupabaseCuratedHotelProvider } from "../../../lib/inventory/SupabaseCuratedHotelProvider.js";
import { buildBudgetPlan } from "../../../lib/recommendation/budgetEngine.js";
import { normalizeTravelerProfile } from "../../../lib/recommendation/travelerProfile.js";
import { createClient } from "../../../lib/supabase/server.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const destination = destinations.find((item) => (item.id || item.airport) === body.destinationId);
    if (!destination) return NextResponse.json({ error: "Unknown destination" }, { status: 400 });
    const profile = normalizeTravelerProfile(body.quiz || {});
    const budgetPlan = buildBudgetPlan(profile, destination);
    const provider = new SupabaseCuratedHotelProvider(await createClient());
    const hotels = await provider.searchHotels({ destination, profile, budgetPlan, limit: 3 });
    return NextResponse.json({ hotels, source: "supabase_curated", isLive: false, incomplete: hotels.length < 3 });
  } catch (error) {
    console.error("Production hotel recommendations unavailable.", error?.message);
    return NextResponse.json({ error: "Hotel recommendations are temporarily unavailable" }, { status: 503 });
  }
}
