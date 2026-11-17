import { destinations } from "./destinations.js";
import { displayName } from "./trending.js";
import { estimateTrip } from "../lib/recommendation/tripEstimate.js";
import { sentencePhrase, sizedPhoto } from "../lib/format.js";
import { activityCount, stayCount } from "../lib/recommendation/eligibility.js";
import { RESORT_ECONOMIES } from "./destinationPlanningAverages.js";

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
  // Enough real content that the guide isn't a thin page: listed stays, verified
  // things to do, and costs from local or regional prices rather than a tier default.
  ["3+ listed stays", (d) => stayCount(d.id) >= 3],
  ["4+ verified things to do", (d) => activityCount(d.id) >= 4],
  // Resort islands keep the high price-tier model on purpose (see destinationPlanningAverages.js).
  ["destination cost data", (d) => RESORT_ECONOMIES.has(d.id) || !["tier", "price_band_partial"].includes(d.planningAverages?.model || "tier")],
];

// Road trips are a hidden product; their routes don't get destination pages.
const isHiddenProduct = (d) => /\bROAD\b/.test(d.city || "");

// Every catalog country, so the continent filter covers every guide. Georgia and
// Armenia sit with Asia, Turkey with Europe; the Caribbean is North America.
const CONTINENT = Object.fromEntries(Object.entries({
  "Asia": "JAPAN|SOUTH KOREA|THAILAND|INDONESIA|SINGAPORE|VIETNAM|MALDIVES|UNITED ARAB EMIRATES|BHUTAN|CAMBODIA|CHINA|INDIA|ISRAEL|JORDAN|KAZAKHSTAN|KYRGYZSTAN|LAOS|LEBANON|MALAYSIA|MALAYSIA AND INDONESIA|NEPAL|OMAN|PHILIPPINES|QATAR|SAUDI ARABIA|SRI LANKA|TAIWAN|UZBEKISTAN|GEORGIA|ARMENIA",
  "Africa": "SOUTH AFRICA|MOROCCO|KENYA|BOTSWANA|EGYPT|ETHIOPIA|GHANA|MADAGASCAR|MAURITIUS|NAMIBIA|NIGERIA|RWANDA|SAO TOME AND PRINCIPE|SENEGAL|SEYCHELLES|TANZANIA|TUNISIA|UGANDA|ZIMBABWE",
  "Europe": "FRANCE|ITALY|GREECE|PORTUGAL|SPAIN|ICELAND|UNITED KINGDOM|ALBANIA|AUSTRIA|BELGIUM|BOSNIA AND HERZEGOVINA|BULGARIA|CROATIA|CZECH REPUBLIC|DENMARK|ESTONIA|FAROE ISLANDS|FINLAND|GERMANY|HUNGARY|IRELAND|LATVIA|LITHUANIA|LUXEMBOURG|MONACO|MONTENEGRO|NETHERLANDS|NORTH MACEDONIA|NORWAY|POLAND|ROMANIA|SERBIA|SLOVAKIA|SLOVENIA|SWEDEN|SWITZERLAND|TURKEY",
  "North America": "UNITED STATES|MEXICO|COSTA RICA|CANADA|BAHAMAS|BARBADOS|BELIZE|CUBA|CURAÇAO|DOMINICA|DOMINICAN REPUBLIC|GUATEMALA|HONDURAS|JAMAICA|PANAMA|PUERTO RICO",
  "South America": "BRAZIL|ARGENTINA|ARGENTINA & CHILE|ARGENTINA AND BRAZIL|BOLIVIA|CHILE|COLOMBIA|ECUADOR|GUYANA|PERU|SURINAME|URUGUAY",
  "Oceania": "AUSTRALIA|NEW ZEALAND|FRENCH POLYNESIA|COOK ISLANDS|FIJI|PALAU|SAMOA|VANUATU",
}).flatMap(([continent, countries]) => countries.split("|").map((country) => [country, continent])));

const SETTINGS = [
  ["Coast", ["Ocean"]],
  ["Mountains", ["Mountains"]],
  ["Nature", ["Nature", "Adventure days", "Wild"]],
  ["City", ["Cities"]],
  ["History & culture", ["Culture"]],
];

// "Hills / Food / Atlantic light" -> "hills, food and Atlantic light"
export function knownFor(style) {
  const parts = String(style || "").split(" / ").filter(Boolean).map(sentencePhrase);
  return parts.length < 2 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function slugFor(destination) {
  return displayName(destination.city).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function completeness(destination) {
  const missing = REQUIRED_FIELDS.filter(([, check]) => !check(destination)).map(([name]) => name);
  if (isHiddenProduct(destination)) missing.push("hidden product (road trip)");
  return { missing, publishable: missing.length === 0 };
}

function toPage(destination) {
  const tags = destination.tags || [];
  const estimate = estimateTrip(destination, { nights: 5, travelers: 1 });
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
    image: sizedPhoto(destination.image, 1920),
    alt: `${displayName(destination.city)}, ${displayName(destination.country)}`,
    estimate,
    planning: destination.planningAverages,
    modelDate: estimate.lastUpdated || null,
    costModel: destination.planningAverages?.model || "tier",
    costLevel: destination.planningAverages?.costLevel || null,
  };
}

// Two places can share a name (La Paz, Bolivia and La Paz, Mexico): both then
// get the country in their slug, so neither guide takes the other's URL.
function withUniqueSlugs(pages) {
  const counts = Object.groupBy(pages, (page) => page.slug);
  return pages.map((page) => counts[page.slug].length > 1 ? { ...page, slug: `${page.slug}-${slugFor({ city: page.country })}` } : page);
}

export const publishedDestinations = withUniqueSlugs(destinations
  .filter((destination) => completeness(destination).publishable)
  .map(toPage))
  .sort((a, b) => a.estimate.low - b.estimate.low);

export function destinationBySlug(slug) {
  return publishedDestinations.find((item) => item.slug === slug) || null;
}

export const CONTINENTS = ["Europe", "Asia", "North America", "South America", "Africa", "Oceania"];
export const SETTING_FILTERS = SETTINGS.map(([label]) => label);
