import { destinations } from "../../data/destinations";
import { normalizeTravelerProfile } from "../../lib/recommendation/travelerProfile";
import { buildBudgetPlan } from "../../lib/recommendation/budgetEngine";
import { addDays, cleanOptions } from "../../lib/themed/price";
import { sharedRateLimit } from "../../lib/security/rateLimit";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
// Road trips and cruises are off the site for now; multi-stop routes need their
// own planner. National parks are left out because their park and concession
// fees aren't in GlobTrek's estimates yet, so a "fits your budget" there could be wrong.
const SKIP_TYPES = new Set(["route", "cruise", "nature_area"]);
const CANDIDATES = destinations.filter((item) => item.image && item.productionReady !== false && !SKIP_TYPES.has(item.destinationType));
const KEYS = ["flights", "hotel", "food", "activities", "transportation", "miscBuffer"];

function shuffled(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

// GET /api/surprise?budget=1500&nights=5&origin=PDX&travelers=1&start=2027-03-10&skip=id,id
// A random place whose whole trip (flights, stay, food, things to do, getting
// around) fits the budget, priced the same way as the rest of GlobTrek.
export async function GET(request) {
  const limited = await sharedRateLimit(request, { name: "surprise", limit: 40 });
  if (limited) return limited;
  const params = new URL(request.url).searchParams;
  const options = cleanOptions({ origin: params.get("origin"), travelers: params.get("travelers"), start: params.get("start") });
  const budget = Math.min(500000, Math.max(0, Math.round(Number(params.get("budget")) || 0)));
  const nights = Math.min(21, Math.max(2, Math.round(Number(params.get("nights")) || 5)));
  const skip = new Set(String(params.get("skip") || "").split(",").slice(0, 200));
  if (budget < 100) return Response.json({ error: "Add a budget of at least $100." }, { status: 400, headers: NO_STORE });
  const profile = normalizeTravelerProfile({ answers: {}, exactBudget: budget, tripStart: options.start, tripEnd: addDays(options.start, nights), isFlexible: false, originAirport: options.origin, guestCount: String(options.travelers), adults: options.travelers, children: 0 });
  // A good surprise uses 45–90% of the budget: a treat, not a compromise, with
  // room to spare for the unexpected. Any fit is the fallback.
  const sweetSpot = (total) => total >= budget * 0.45 && total <= budget * 0.9;
  const fits = [];
  let cheapest = null;
  for (const destination of shuffled(CANDIDATES)) {
    if (skip.has(destination.id) || destination.airport === options.origin) continue;
    const plan = buildBudgetPlan(profile, destination);
    const total = KEYS.reduce((sum, key) => sum + (Number(plan.estimates?.[key]?.average) || 0), 0);
    if (!cheapest || total < cheapest.total) cheapest = { destination, total };
    if (!plan.withinHardBudget || total > budget) continue;
    fits.push({ destination, plan, total });
    if (sweetSpot(total) || fits.length >= 40) break;
  }
  const pick = fits.find((item) => sweetSpot(item.total)) || fits.find((item) => item.total >= budget * 0.45) || fits[0];
  if (!pick) return Response.json({ error: "none_fit", cheapest: cheapest ? { city: cheapest.destination.city, country: cheapest.destination.country, total: Math.round(cheapest.total) } : null }, { status: 200, headers: NO_STORE });
  const { destination, plan, total } = pick;
  return Response.json({
    result: {
      id: destination.id, city: destination.city, country: destination.country, image: destination.image, imageAlt: destination.imageAlt || `${destination.city}, ${destination.country}`,
      tags: (destination.tags || []).slice(0, 4),
      start: options.start, end: addDays(options.start, nights), nights, travelers: options.travelers, origin: options.origin, budget,
      total: Math.round(total), spare: Math.round(budget - total), spendStyle: plan.spendStyle,
      lines: Object.fromEntries(KEYS.map((key) => [key, Math.round(Number(plan.estimates?.[key]?.average) || 0)])),
    },
  }, { headers: NO_STORE });
}
