import { readFile, writeFile } from "node:fs/promises";

function option(name, fallback = null) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; }
async function loadEnvironment(path) { try { for (const line of (await readFile(path, "utf8")).split(/\r?\n/)) { const match = line.match(/^([A-Z0-9_]+)=(.*)$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, ""); } } catch {} }
function decode(value) { return String(value || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); }
function meta(html, name) { const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); return decode(html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1] || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["']`, "i"))?.[1]); }
function pageEvidence(html) { const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]); const description = meta(html, "description") || meta(html, "og:description") || meta(html, "twitter:description"); return [title, description].filter(Boolean).join(" — ").slice(0, 1400); }
async function officialEvidence(url) {
  if (!url) return null;
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (["booking.com", "expedia.com", "tripadvisor.com", "google.com"].some((domain) => host === domain || host.endsWith(`.${domain}`))) return null;
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(10000), headers: { "User-Agent": "Mozilla/5.0 (compatible; GlobTrekCatalog/1.0)" } });
  if (!response.ok || !String(response.headers.get("content-type") || "").includes("text/html")) return null;
  const evidence = pageEvidence((await response.text()).slice(0, 750000));
  return evidence.length >= 25 ? { evidence, sourceUrl: response.url || url } : null;
}

const scoreFields = ["calmScore", "energyScore", "designScore", "romanceScore", "familyScore", "wellnessScore", "nightlifeScore", "locationScore", "socialScore", "businessScore", "luxuryScore", "valueScore"];
const styleTags = ["boutique", "romantic", "wellness", "design", "family", "nightlife", "central", "resort", "historic", "business", "beach", "ski", "adults-oriented", "all-inclusive", "hostel", "airport", "nature"];
const itemSchema = { type: "object", additionalProperties: false, required: ["googlePlaceId", "priceTier", "priceConfidence", ...scoreFields, "styleTags", "classificationConfidence", "rationale"], properties: { googlePlaceId: { type: "string" }, priceTier: { type: ["string", "null"], enum: ["value", "midrange", "premium", null] }, priceConfidence: { type: "number", minimum: 0, maximum: 1 }, ...Object.fromEntries(scoreFields.map((field) => [field, { type: "integer", minimum: 0, maximum: 100 }])), styleTags: { type: "array", items: { type: "string", enum: styleTags } }, classificationConfidence: { type: "number", minimum: 0, maximum: 1 }, rationale: { type: "string", maxLength: 240 } } };

async function classify(items) {
  const gateway = Boolean(process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY);
  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.OPENAI_API_KEY;
  const response = await fetch(gateway ? "https://ai-gateway.vercel.sh/v1/responses" : "https://api.openai.com/v1/responses", { method: "POST", signal: AbortSignal.timeout(90000), headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || (gateway ? "openai/gpt-5.4-nano" : "gpt-5.4-nano"), input: [{ role: "system", content: "Classify only the supplied real hotels from their official/brand webpage title and metadata. Price tier means relative property positioning within its destination, not a live price. Derive style scores conservatively from explicit positioning; do not invent amenities, prices, ratings, or booking support. Use null priceTier and low confidence when evidence is insufficient. Return every supplied Google Place ID exactly once." }, { role: "user", content: JSON.stringify(items) }], text: { format: { type: "json_schema", name: "hotel_classification_batch", strict: true, schema: { type: "object", additionalProperties: false, required: ["hotels"], properties: { hotels: { type: "array", minItems: items.length, maxItems: items.length, items: itemSchema } } } } } }) });
  if (!response.ok) throw new Error(`classification_${response.status}:${(await response.text()).slice(0, 200)}`);
  const data = await response.json();
  return JSON.parse(data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join("") || "{}").hotels;
}

await loadEnvironment(option("--env", ".env.production.local"));
const input = JSON.parse(await readFile(option("--input", "scripts/hotels/google-candidate-audit.json"), "utf8"));
const output = option("--output", "scripts/hotels/google-candidate-classifications.json");
const batchSize = Math.min(10, Math.max(1, Number(option("--batch-size", 8))));
const limit = Math.max(1, Number(option("--limit", input.accepted.length)));
let report = { generatedAt: new Date().toISOString(), records: [], failures: [] };
if (process.argv.includes("--resume")) { try { report = JSON.parse(await readFile(output, "utf8")); } catch {} }
const completed = new Set([...report.records.map((item) => item.googlePlaceId), ...report.failures.filter((item) => item.terminal).map((item) => item.googlePlaceId)]);
const queue = input.accepted.filter((item) => !completed.has(item.googlePlaceId)).slice(0, limit);
let halted = false;
for (let index = 0; index < queue.length; index += batchSize) {
  const candidates = queue.slice(index, index + batchSize);
  const evidence = (await Promise.all(candidates.map(async (item) => { try { const page = await officialEvidence(item.websiteUri); return page ? { ...item, ...page } : null; } catch { return null; } }))).filter(Boolean);
  for (const item of candidates.filter((candidate) => !evidence.some((value) => value.googlePlaceId === candidate.googlePlaceId))) report.failures.push({ googlePlaceId: item.googlePlaceId, destinationId: item.destinationId, name: item.name, error: "official_evidence_unavailable", terminal: true });
  if (evidence.length) {
    try {
      const classified = await classify(evidence.map((item) => ({ googlePlaceId: item.googlePlaceId, name: item.name, destination: `${item.city}, ${item.country}`, searchCenter: item.searchCenter, propertyType: item.primaryType, officialEvidence: item.evidence })));
      const sourceById = new Map(evidence.map((item) => [item.googlePlaceId, item]));
      for (const result of classified) { const source = sourceById.get(result.googlePlaceId); if (source) report.records.push({ destinationId: source.destinationId, name: source.name, sourceUrl: source.sourceUrl, classifiedAt: new Date().toISOString(), ...result }); }
    } catch (error) {
      const capacityBlocked = /^classification_(402|429):/.test(error.message) || /credit card|paid credits|top-up/i.test(error.message);
      const failedItems = capacityBlocked ? evidence.slice(0, 1) : evidence;
      for (const item of failedItems) report.failures.push({ googlePlaceId: item.googlePlaceId, destinationId: item.destinationId, name: item.name, error: error.message, terminal: false });
      halted = capacityBlocked;
    }
  }
  report.generatedAt = new Date().toISOString();
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${Math.min(index + batchSize, queue.length)}/${queue.length} classified=${report.records.length} failures=${report.failures.length}`);
  if (halted) { console.log("Classification paused before paid capacity."); break; }
}
