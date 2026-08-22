import { readFile, writeFile } from "node:fs/promises";

function option(name, fallback = null) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; }
async function loadEnvironment(path) { try { for (const line of (await readFile(path, "utf8")).split(/\r?\n/)) { const match = line.match(/^([A-Z0-9_]+)=(.*)$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, ""); } } catch {} }
const supported = (item, dimension) => item.sources?.some((source) => source.validated && source.supports?.includes(dimension));
const tagDimension = { boutique: "design", romantic: "romance", wellness: "wellness", design: "design", family: "family", nightlife: "nightlife", central: "location", business: "business" };
function groundedTags(item) {
  const evidence = item.sources?.filter((source) => source.validated).map((source) => source.quote).join(" ") || "";
  return [...new Set((item.styleTags || []).filter((tag) => tagDimension[tag] ? supported(item, tagDimension[tag]) : new RegExp(`\\b${tag.replace("-", "[- ]")}\\b`, "i").test(evidence)))];
}

await loadEnvironment(option("--env", ".env.production.local"));
const apply = process.argv.includes("--apply");
const artifact = JSON.parse(await readFile(option("--input", "scripts/hotels/web-evidence-classifications.json"), "utf8"));
const eligible = [...new Map(artifact.records.map((item) => [item.googlePlaceId, item])).values()].filter((item) => item.evidenceValidated && item.identityConfirmed && item.priceTier && item.priceConfidence >= 0.6 && item.calmScore != null && item.energyScore != null && item.classificationConfidence >= 0.6 && supported(item, "identity") && supported(item, "price") && supported(item, "calm") && supported(item, "energy"));
const root = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const token = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!root.startsWith("https://") || !token) throw new Error("Production Supabase environment is unavailable");
const headers = { apikey: token, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const summary = { generatedAt: new Date().toISOString(), dryRun: !apply, researched: artifact.records.length, eligible: eligible.length, updated: 0, skippedExistingReady: 0, missingStagedRecord: 0, failedQualityFloor: 0, tiers: Object.fromEntries(["value", "midrange", "premium"].map((tier) => [tier, eligible.filter((item) => item.priceTier === tier).length])) };

for (const item of eligible) {
  const lookup = await fetch(`${root}/hotel_catalog?select=id,recommendation_ready,provider,identity_confidence,location_confidence,photo_count&google_place_id=eq.${encodeURIComponent(item.googlePlaceId)}&active=eq.true`, { headers });
  if (!lookup.ok) throw new Error(`web_evidence_lookup_${lookup.status}`);
  const matches = await lookup.json();
  const hotel = matches.find((candidate) => candidate.provider === "google_places" && !candidate.recommendation_ready);
  if (!hotel) { if (matches.some((candidate) => candidate.recommendation_ready)) summary.skippedExistingReady += 1; else summary.missingStagedRecord += 1; continue; }
  if (Number(hotel.identity_confidence) < 0.8 || Number(hotel.location_confidence) < 0.8 || Number(hotel.photo_count) < 1) { summary.failedQualityFloor += 1; continue; }
  if (apply) {
    const score = (field) => item[field] == null || !supported(item, field.replace("Score", "").replace("romance", "romance")) ? null : item[field];
    const body = {
      price_tier: item.priceTier, price_confidence: item.priceConfidence, price_source: "validated_cited_web_evidence", price_last_checked: item.classifiedAt,
      calm_score: item.calmScore, relaxation_score: item.calmScore, energy_score: item.energyScore,
      design_score: score("designScore"), romantic_score: score("romanceScore"), family_score: score("familyScore"), nightlife_score: score("nightlifeScore"),
      centrality_score: score("locationScore"), social_score: score("socialScore"), business_score: score("businessScore"), luxury_score: item.luxuryScore, value_score: item.valueScore,
      style_tags: groundedTags(item), data_completeness_score: 80, recommendation_ready: true, review_status: "verified",
      verification_source: item.sources.find((source) => source.validated && source.supports.includes("identity"))?.resolvedUrl || item.officialWebsite,
      verified_at: item.classifiedAt, updated_at: new Date().toISOString(),
    };
    const update = await fetch(`${root}/hotel_catalog?id=eq.${hotel.id}`, { method: "PATCH", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(body) });
    if (!update.ok) throw new Error(`web_evidence_update_${update.status}:${(await update.text()).slice(0, 200)}`);
  }
  summary.updated += 1;
}
await writeFile(option("--report", "scripts/hotels/web-evidence-promotion.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
