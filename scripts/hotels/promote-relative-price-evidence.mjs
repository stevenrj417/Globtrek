import { readFile, writeFile } from "node:fs/promises";
import { buildDestinationPositioningBenchmarks, classificationSanity, deriveGroundedRelativeTier } from "./relative-price-tools.mjs";

function option(name, fallback = null) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; }
async function loadEnvironment(path) { try { for (const line of (await readFile(path, "utf8")).split(/\r?\n/)) { const match = line.match(/^([A-Z0-9_]+)=(.*)$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, ""); } } catch {} }

await loadEnvironment(option("--env", ".env.production.local"));
const apply = process.argv.includes("--apply");
const artifact = JSON.parse(await readFile(option("--input", "scripts/hotels/google-candidate-classifications.json"), "utf8"));
const records = [...new Map(artifact.records.map((item) => [item.googlePlaceId, item])).values()];
const benchmarks = buildDestinationPositioningBenchmarks(records);
let focused = { records: [] };
try { focused = JSON.parse(await readFile(option("--relative-input", "scripts/hotels/relative-price-classifications.json"), "utf8")); } catch {}
const focusedById = new Map(focused.records.map((item) => [item.googlePlaceId, item]));
const candidates = records.map((item) => {
  const evidence = focusedById.get(item.googlePlaceId);
  const focusedPrice = evidence?.priceTier && evidence.priceConfidence >= 0.6 && evidence.basis !== "insufficient" && Number(item.classificationConfidence) >= 0.5
    ? { tier: evidence.priceTier, confidence: evidence.priceConfidence, basis: `exact_phrase_${evidence.basis}`, classifiedAt: evidence.classifiedAt, sourceUrl: evidence.sourceUrl }
    : null;
  return { item, price: focusedPrice || deriveGroundedRelativeTier(item, benchmarks.get(item.destinationId)) };
})
  .filter(({ item, price }) => !item.priceTier && price)
  .map(({ item, price }) => ({ ...item, derivedPrice: price, sanityFailures: classificationSanity(item, price) }));
const eligible = candidates.filter((item) => item.sanityFailures.length === 0);

const root = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const token = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!root.startsWith("https://") || !token) throw new Error("Production Supabase environment is unavailable");
const headers = { apikey: token, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const summary = { generatedAt: new Date().toISOString(), dryRun: !apply, considered: candidates.length, eligible: eligible.length, rejectedBySanity: candidates.length - eligible.length, updated: 0, skippedExistingReady: 0, missingStagedRecord: 0, tiers: Object.fromEntries(["value", "midrange", "premium"].map((tier) => [tier, eligible.filter((item) => item.derivedPrice.tier === tier).length])), rejections: candidates.filter((item) => item.sanityFailures.length).map((item) => ({ googlePlaceId: item.googlePlaceId, name: item.name, failures: item.sanityFailures })) };

for (const item of eligible) {
  const lookup = await fetch(`${root}/hotel_catalog?select=id,recommendation_ready,provider,identity_confidence,location_confidence,photo_count,data_completeness_score&google_place_id=eq.${encodeURIComponent(item.googlePlaceId)}&active=eq.true`, { headers });
  if (!lookup.ok) throw new Error(`relative_price_lookup_${lookup.status}`);
  const matches = await lookup.json();
  const hotel = matches.find((candidate) => candidate.provider === "google_places" && !candidate.recommendation_ready);
  if (!hotel) { if (matches.some((candidate) => candidate.recommendation_ready)) summary.skippedExistingReady += 1; else summary.missingStagedRecord += 1; continue; }
  const ready = Number(hotel.identity_confidence) >= 0.8 && Number(hotel.location_confidence) >= 0.8 && Number(hotel.photo_count) >= 1;
  if (!ready) { summary.missingStagedRecord += 1; continue; }
  if (apply) {
    const body = {
      price_tier: item.derivedPrice.tier, price_confidence: item.derivedPrice.confidence,
      price_source: `destination_relative_${item.derivedPrice.basis}`, price_last_checked: item.derivedPrice.classifiedAt || item.classifiedAt,
      calm_score: item.calmScore, relaxation_score: item.calmScore, energy_score: item.energyScore, design_score: item.designScore,
      romantic_score: item.romanceScore, family_score: item.familyScore, nightlife_score: item.nightlifeScore,
      centrality_score: item.locationScore, social_score: item.socialScore, business_score: item.businessScore,
      luxury_score: item.luxuryScore, value_score: item.valueScore, style_tags: [...new Set(item.styleTags)],
      data_completeness_score: 80,
      recommendation_ready: true, review_status: "verified", verification_source: item.derivedPrice.sourceUrl || item.sourceUrl,
      verified_at: item.derivedPrice.classifiedAt || item.classifiedAt, updated_at: new Date().toISOString(),
    };
    const update = await fetch(`${root}/hotel_catalog?id=eq.${hotel.id}`, { method: "PATCH", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(body) });
    if (!update.ok) throw new Error(`relative_price_update_${update.status}:${(await update.text()).slice(0, 200)}`);
  }
  summary.updated += 1;
}

await writeFile(option("--report", "scripts/hotels/relative-price-promotion.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
