import { readFile, writeFile } from "node:fs/promises";

function option(name, fallback = null) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; }
async function loadEnvironment(path) { try { for (const line of (await readFile(path, "utf8")).split(/\r?\n/)) { const match = line.match(/^([A-Z0-9_]+)=(.*)$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, ""); } } catch {} }
function range(values) { if (values.length < 3) return null; const sorted = [...values].sort((a, b) => a - b); return { low: Math.round(sorted[Math.floor((sorted.length - 1) * 0.25)]), high: Math.round(sorted[Math.ceil((sorted.length - 1) * 0.75)]) }; }

await loadEnvironment(option("--env", ".env.production.local"));
const apply = process.argv.includes("--apply");
const root = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const token = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: token, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
async function rows(path) { const all = []; for (let offset = 0; ; offset += 1000) { const response = await fetch(`${root}/${path}`, { headers: { ...headers, Range: `${offset}-${offset + 999}` } }); if (!response.ok) throw new Error(`benchmark_read_${response.status}`); const page = await response.json(); all.push(...page); if (page.length < 1000) return all; } }

const [destinations, hotels] = await Promise.all([
  rows("travel_destinations?select=id,city,cost_profile&active=eq.true"),
  rows("hotel_catalog?select=destination_id,price_tier,price_confidence,price_source,typical_nightly_low,typical_nightly_high,currency,recommendation_ready&active=eq.true"),
]);
const generatedAt = new Date().toISOString();
const reports = [];
for (const destination of destinations) {
  const inventory = hotels.filter((hotel) => hotel.destination_id === destination.id && hotel.recommendation_ready && hotel.price_tier);
  const currencies = new Set(inventory.map((hotel) => hotel.currency).filter(Boolean));
  const currency = currencies.size === 1 ? [...currencies][0] : null;
  const nightly = (tier) => inventory.filter((hotel) => hotel.price_tier === tier && hotel.typical_nightly_low != null && hotel.typical_nightly_high != null).flatMap((hotel) => [Number(hotel.typical_nightly_low), Number(hotel.typical_nightly_high)]);
  const intelligence = {
    model: "destination_relative_official_positioning_v1", lastVerified: generatedAt,
    source: "official_property_positioning_and_verified_rate_observations",
    confidence: Math.min(0.85, Number((0.35 + Math.min(10, inventory.length) * 0.04).toFixed(2))),
    anchorCount: inventory.length,
    tierCounts: Object.fromEntries(["value", "midrange", "premium"].map((tier) => [tier, inventory.filter((hotel) => hotel.price_tier === tier).length])),
    typicalNightlyRanges: currency ? Object.fromEntries(["value", "midrange", "premium"].map((tier) => [tier, range(nightly(tier))])) : { value: null, midrange: null, premium: null },
    currency,
    rangeStatus: currency && ["value", "midrange", "premium"].some((tier) => range(nightly(tier))) ? "grounded_observed_ranges_partial" : "insufficient_verified_rate_observations",
    estimateOnly: true,
  };
  const costProfile = { ...(destination.cost_profile || {}), hotelPriceIntelligence: intelligence };
  reports.push({ destinationId: destination.id, destination: destination.city, ...intelligence });
  if (apply) { const response = await fetch(`${root}/travel_destinations?id=eq.${encodeURIComponent(destination.id)}`, { method: "PATCH", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify({ cost_profile: costProfile, cost_last_updated: generatedAt.slice(0, 10), updated_at: generatedAt }) }); if (!response.ok) throw new Error(`benchmark_update_${response.status}:${(await response.text()).slice(0, 160)}`); }
}
const report = { generatedAt, dryRun: !apply, destinations: reports.length, withAnyAnchors: reports.filter((item) => item.anchorCount).length, withGroundedNightlyRanges: reports.filter((item) => item.rangeStatus === "grounded_observed_ranges_partial").length, perDestination: reports };
await writeFile(option("--report", "scripts/hotels/destination-price-benchmarks.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ generatedAt, dryRun: !apply, destinations: report.destinations, withAnyAnchors: report.withAnyAnchors, withGroundedNightlyRanges: report.withGroundedNightlyRanges }, null, 2));

