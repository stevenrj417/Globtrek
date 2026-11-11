// Imports Airalo's public product feed (https://www.airalo.com/products.xml,
// documented by Travelpayouts) into app/data/airaloEsims.json: single-country
// data plans in USD for every country in GlobTrek's catalog.
//   node scripts/extras/import-airalo.mjs [path-to-downloaded-feed.xml]
import { readFile, writeFile } from "node:fs/promises";

const FEED = "https://www.airalo.com/products.xml";
const { destinations } = await import("../../app/data/destinations.js");
const xml = process.argv[2] ? await readFile(process.argv[2], "utf8") : await (await fetch(FEED)).text();

const field = (item, name) => {
  const match = item.match(new RegExp(`<g:${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</g:${name}>`));
  return match ? match[1].trim() : null;
};
const detail = (item, name) => {
  const match = item.match(new RegExp(`<g:attribute_name>${name}</g:attribute_name>\\s*<g:attribute_value>([^<]*)</g:attribute_value>`));
  return match ? match[1].trim() : null;
};
const slug = (value) => String(value).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ALIASES = { "north-macedonia": "macedonia", "puerto-rico": "puerto-rico-us" };
const wanted = new Map(destinations.map((destination) => [ALIASES[slug(destination.country)] || slug(destination.country), destination.country]));

const countries = {};
for (const item of xml.split("<item>").slice(1)) {
  const group = field(item, "item_group_id") || "";
  if (!group.startsWith("country-")) continue;
  const country = group.slice("country-".length);
  if (!wanted.has(country)) continue;
  const [amount, currency] = String(field(item, "price") || "").split(" ");
  const price = Number(amount);
  const link = field(item, "link");
  const data = detail(item, "Data") || field(item, "custom_label_2");
  const days = Number.parseInt(detail(item, "Validity") || field(item, "custom_label_3"), 10);
  if (currency !== "USD" || !Number.isFinite(price) || field(item, "availability") !== "in_stock" || !link?.startsWith("https://www.airalo.com/") || !Number.isFinite(days)) continue;
  if ((detail(item, "Plan type") || "Data") !== "Data") continue;
  const gb = /unlimited/i.test(data || "") ? null : Number.parseFloat(data);
  (countries[country] ||= { name: wanted.get(country), pageUrl: field(item, "canonical_link"), plans: [] }).plans.push({
    id: field(item, "id"), title: field(item, "title"), gb, unlimited: gb === null, days, price, currency, url: link.replace(/\?currency=USD$/, ""),
    networks: detail(item, "Supported networks"),
  });
}
for (const entry of Object.values(countries)) entry.plans.sort((a, b) => a.days - b.days || a.price - b.price);
await writeFile(new URL("../../app/data/airaloEsims.json", import.meta.url), `${JSON.stringify({ source: FEED, checkedAt: new Date().toISOString().slice(0, 10), currency: "USD", countries })}\n`);
const missing = [...wanted.entries()].filter(([key]) => !countries[key]).map(([, name]) => name);
console.log(`${Object.keys(countries).length} countries, ${Object.values(countries).reduce((sum, entry) => sum + entry.plans.length, 0)} plans. No single-country plan: ${missing.join(", ") || "none"}`);
