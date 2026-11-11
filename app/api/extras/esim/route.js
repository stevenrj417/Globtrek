import { esimPlans } from "../../../lib/extras/esim.js";
import { partnerUrls } from "../../../lib/travelpayouts/partnerCache.js";
import { sharedRateLimit } from "../../../lib/security/rateLimit.js";

export const dynamic = "force-dynamic";

// Optional eSIM plans for an international trip (Airalo feed prices, USD).
export async function GET(request) {
  const limited = await sharedRateLimit(request, { name: "esim", limit: 30 });
  if (limited) return limited;
  const params = new URL(request.url).searchParams;
  const country = String(params.get("country") || "").slice(0, 60);
  const home = String(params.get("home") || "").slice(0, 60);
  const nights = Math.min(60, Math.max(1, Number.parseInt(params.get("nights"), 10) || 5));
  if (!country) return Response.json({ error: "Choose a country." }, { status: 400 });
  const plans = esimPlans(country, nights, { homeCountry: home || null });
  const links = await partnerUrls(plans.map((plan) => plan.url), { subId: "esim" });
  return Response.json({
    plans: plans.map((plan, index) => ({ title: plan.title, gb: plan.gb, unlimited: plan.unlimited, days: plan.days, price: plan.price, currency: plan.currency, networks: plan.networks, checkedAt: plan.checkedAt, bookingUrl: links[index].partnerUrl || plan.url, attributed: Boolean(links[index].partnerUrl) })),
  }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
