import { readFile } from "node:fs/promises";

const SCORE_FIELDS = ["luxuryScore", "relaxationScore", "designScore", "nightlifeScore", "localFeelScore", "familyScore", "romanticScore", "centralityScore", "valueScore"];
const allowedTags = ["boutique", "minimalist", "historic", "modern", "resort", "beachfront", "wellness", "nightlife", "quiet", "central", "nature", "food-focused", "business", "romantic"];

export function validateEnrichment(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.styleTags)) return false;
  if (!SCORE_FIELDS.every((field) => Number.isInteger(value[field]) && value[field] >= 0 && value[field] <= 100)) return false;
  return value.styleTags.every((tag) => allowedTags.includes(tag));
}

export async function enrichHotel(hotel, fetchImpl = fetch) {
  if (!hotel.description) throw new Error("legitimate_description_required");
  const response = await fetchImpl("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5.4-nano", input: [{ role: "system", content: "Classify only subjective hotel traits from supplied metadata. Never infer factual prices, ratings, location, availability, or amenities. Return strict JSON." }, { role: "user", content: JSON.stringify({ name: hotel.name, city: hotel.city, country: hotel.country, description: hotel.description, suppliedTags: hotel.styleTags || [] }) }], text: { format: { type: "json_schema", name: "hotel_enrichment", strict: true, schema: { type: "object", additionalProperties: false, required: [...SCORE_FIELDS, "styleTags"], properties: { ...Object.fromEntries(SCORE_FIELDS.map((field) => [field, { type: "integer", minimum: 0, maximum: 100 }])), styleTags: { type: "array", items: { type: "string", enum: allowedTags } } } } } } }) });
  if (!response.ok) throw new Error(`enrichment_${response.status}`);
  const data = await response.json();
  const text = data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join("") || "";
  const result = JSON.parse(text);
  if (!validateEnrichment(result)) throw new Error("malformed_enrichment");
  return result;
}

if (process.argv[1]?.endsWith("enrich-hotels.mjs")) {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: npm run hotels:enrich -- normalized-hotels.json");
  const hotels = JSON.parse(await readFile(path, "utf8"));
  for (const hotel of hotels) {
    try { console.log(JSON.stringify({ id: hotel.id, enrichment: await enrichHotel(hotel) })); }
    catch (error) { console.error(JSON.stringify({ id: hotel.id, error: error.message })); }
  }
}
