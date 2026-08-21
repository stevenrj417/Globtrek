import { readFile } from "node:fs/promises";

function option(name, fallback = null) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; }
async function loadEnvironment(path) { try { for (const line of (await readFile(path, "utf8")).split(/\r?\n/)) { const match = line.match(/^([A-Z0-9_]+)=(.*)$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, ""); } } catch {} }

await loadEnvironment(option("--env", ".env.production.local"));
const apply = process.argv.includes("--apply");
const report = JSON.parse(await readFile(option("--input", "scripts/hotels/google-candidate-classifications.json"), "utf8"));
const root = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const headers = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" };
const eligible = [...new Map(report.records.map((item) => [item.googlePlaceId, item])).values()].filter((item) => item.priceTier && item.priceConfidence >= 0.5 && item.classificationConfidence >= 0.5);
const summary = { classified: report.records.length, eligible: eligible.length, updated: 0, skippedExistingReady: 0, missingStagedRecord: 0, dryRun: !apply };
for (const item of eligible) {
  const lookup = await fetch(`${root}/hotel_catalog?select=id,recommendation_ready,provider&google_place_id=eq.${encodeURIComponent(item.googlePlaceId)}&active=eq.true`, { headers });
  if (!lookup.ok) throw new Error(`classification_lookup_${lookup.status}`);
  const candidates = await lookup.json();
  const hotel = candidates.find((candidate) => candidate.provider === "google_places" && !candidate.recommendation_ready);
  if (!hotel) { if (candidates.some((candidate) => candidate.recommendation_ready)) summary.skippedExistingReady += 1; else summary.missingStagedRecord += 1; continue; }
  if (!apply) { summary.updated += 1; continue; }
  const body = {
    price_tier: item.priceTier, price_confidence: item.priceConfidence, price_source: "official_property_positioning_classification", price_last_checked: item.classifiedAt,
    calm_score: item.calmScore, relaxation_score: item.calmScore, energy_score: item.energyScore, design_score: item.designScore, romantic_score: item.romanceScore,
    family_score: item.familyScore, nightlife_score: item.nightlifeScore, centrality_score: item.locationScore, social_score: item.socialScore,
    business_score: item.businessScore, luxury_score: item.luxuryScore, value_score: item.valueScore, style_tags: [...new Set(item.styleTags)],
    data_completeness_score: 80, recommendation_ready: true, review_status: "verified", verification_source: item.sourceUrl, verified_at: item.classifiedAt, updated_at: new Date().toISOString(),
  };
  const update = await fetch(`${root}/hotel_catalog?id=eq.${hotel.id}`, { method: "PATCH", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(body) });
  if (!update.ok) throw new Error(`classification_update_${update.status}:${(await update.text()).slice(0, 200)}`);
  summary.updated += 1;
}
console.log(JSON.stringify(summary, null, 2));
