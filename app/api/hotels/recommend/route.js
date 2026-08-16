import { NextResponse } from "next/server";
import { destinations } from "../../../data/destinations.js";
import { CuratedHotelProvider } from "../../../lib/inventory/CuratedHotelProvider.js";
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
    try {
      const provider = new SupabaseCuratedHotelProvider(await createClient());
      const hotels = await provider.searchHotels({ destination, profile, budgetPlan, limit: 3 });
      if (hotels.length) return NextResponse.json({ hotels, source: "supabase_curated", isLive: false });
    } catch (error) {
      console.warn("Supabase hotel catalog unavailable; using versioned catalog.", error?.message);
    }
    const hotels = await new CuratedHotelProvider().searchHotels({ destination, profile, budgetPlan, limit: 3 });
    return NextResponse.json({ hotels, source: "versioned_curated_fallback", isLive: false });
  } catch {
    return NextResponse.json({ error: "Could not recommend hotels" }, { status: 400 });
  }
}
