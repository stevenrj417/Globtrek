import { destinations } from "../../../data/destinations";
import { SupabaseActivityProvider } from "../../../lib/inventory/SupabaseActivityProvider";
import { buildBudgetPlan } from "../../../lib/recommendation/budgetEngine";
import { normalizeTravelerProfile } from "../../../lib/recommendation/travelerProfile";
import { createClient } from "../../../lib/supabase/server";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const destination = destinations.find((item) => item.airport === body.destinationId);
  if (!destination) return Response.json({ error: "Unknown destination" }, { status: 400 });
  try {
    const profile = normalizeTravelerProfile(body.quiz || {});
    const budgetPlan = buildBudgetPlan(profile, destination);
    const provider = new SupabaseActivityProvider(await createClient());
    const activities = await provider.searchActivities({ destinationId: destination.airport, profile, budgetPlan, context: {}, limit: 4 });
    return Response.json({ activities, source: "supabase_verified", isLive: false });
  } catch (error) {
    console.warn("Verified activity catalog unavailable.", error instanceof Error ? error.message : "unknown");
    return Response.json({ activities: [], source: "unavailable", isLive: false });
  }
}
