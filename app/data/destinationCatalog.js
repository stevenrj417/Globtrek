import { destinations } from "./destinations.js";
import { displayName } from "./trending.js";
import { estimateTrip } from "../lib/recommendation/tripEstimate.js";

// Publishing gate for /destinations. A destination gets a public, indexable page
// only when every field the page shows comes from reviewed data. See DECISIONS.md.
export const REQUIRED_FIELDS = [
  ["city", (d) => Boolean(d.city)],
  ["country", (d) => Boolean(d.country)],
  ["airport", (d) => /^[A-Z]{3}$/.test(d.airport || "")],
  ["image", (d) => Boolean(d.image)],
  ["editorial style", (d) => Boolean(d.style) && !/considered escape/i.test(d.style)],
  ["reviewed seasonal guidance", (d) => Boolean(d.season) && !/requires .*review/i.test(d.season)],
  ["cost model", (d) => Array.isArray(d.planningAverages?.monthly) && d.planningAverages.monthly.length === 12],
  ["recommendation ready", (d) => d.recommendationReady !== false],
];

// Road trips are a hidden product; their routes don't get destination pages.
const isHiddenProduct = (d) => /\bROAD\b/.test(d.city || "");

const CONTINENT = {
  JAPAN: "Asia", "SOUTH KOREA": "Asia", THAILAND: "Asia", INDONESIA: "Asia", SINGAPORE: "Asia", VIETNAM: "Asia", MALDIVES: "Asia", "UNITED ARAB EMIRATES": "Asia",
  "SOUTH AFRICA": "Africa", MOROCCO: "Africa", KENYA: "Africa",
  FRANCE: "Europe", ITALY: "Europe", GREECE: "Europe", PORTUGAL: "Europe", SPAIN: "Europe", ICELAND: "Europe", "UNITED KINGDOM": "Europe",
  "UNITED STATES": "North America", MEXICO: "North America", "COSTA RICA": "North America", CANADA: "North America",
  BRAZIL: "South America", ARGENTINA: "South America", "ARGENTINA & CHILE": "South America",
  AUSTRALIA: "Oceania", "NEW ZEALAND": "Oceania", "FRENCH POLYNESIA": "Oceania",
};

const SETTINGS = [
  ["Coast", ["Ocean"]],
  ["Mountains", ["Mountains"]],
  ["Nature", ["Nature", "Adventure days"]],
  ["City", ["Cities"]],
  ["History & culture", ["Culture"]],
];

// "Hills / Food / Atlantic light" -> "hills, food and Atlantic light"
export function knownFor(style) {
  const parts = String(style || "").split(" / ").filter(Boolean).map((part) => (part.includes(" ") ? part : part.toLowerCase()));
  return parts.length < 2 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function slugFor(destination) {
  return displayName(destination.city).toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function completeness(destination) {
  const missing = REQUIRED_FIELDS.filter(([, check]) => !check(destination)).map(([name]) => name);
  if (isHiddenProduct(destination)) missing.push("hidden product (road trip)");
  return { missing, publishable: missing.length === 0 };
}

function toPage(destination) {
  const tags = destination.tags || [];
  const estimate = estimateTrip(destination, { nights: 5, travelers: 2 });
  return {
    id: destination.id,
    slug: slugFor(destination),
    name: displayName(destination.city),
    country: displayName(destination.country),
    continent: CONTINENT[destination.country] || null,
    settings: SETTINGS.filter(([, keys]) => keys.some((key) => tags.includes(key))).map(([label]) => label),
    vibe: destination.style.split(" / ").slice(0, 2).join(" & "),
    style: destination.style,
    knownFor: knownFor(destination.style),
    season: destination.season,
    airport: destination.airport,
    knownness: Number.isFinite(destination.recognition) ? destination.recognition : null,
    image: destination.image,
    alt: `${displayName(destination.city)}, ${displayName(destination.country)}`,
    estimate,
    planning: destination.planningAverages,
    modelDate: estimate.lastUpdated || null,
    costModel: destination.planningAverages?.model || "tier",
    costLevel: destination.planningAverages?.costLevel || null,
  };
}

export const publishedDestinations = destinations
  .filter((destination) => completeness(destination).publishable)
  .map(toPage)
  .sort((a, b) => a.estimate.low - b.estimate.low);

export function destinationBySlug(slug) {
  return publishedDestinations.find((item) => item.slug === slug) || null;
}

export const CONTINENTS = ["Europe", "Asia", "North America", "South America", "Africa", "Oceania"];
export const SETTING_FILTERS = SETTINGS.map(([label]) => label);
