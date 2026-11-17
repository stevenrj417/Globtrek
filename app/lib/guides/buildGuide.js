// Builds each search guide from real data only (server-side; the stay feed and
// Google Places files are too large for the browser). A guide that can't show
// 4 real stays for its search returns null and isn't published.
import feedStays from "../../data/feedStays.json" with { type: "json" };
import guidePlaces from "../../data/guidePlaces.json" with { type: "json" };
import airportCoords from "../../data/airportCoords.json" with { type: "json" };
import climate from "../../../scripts/destinations/climate.json" with { type: "json" };
import fareIndex from "../../data/pricing/fareIndex.json" with { type: "json" };
import lodgingBands from "../../data/lodgingPriceBands.json" with { type: "json" };
import guideStays from "../../data/guideStays.json" with { type: "json" };
import guideTownData from "../../data/guideTownData.json" with { type: "json" };
import guideHotelPicks from "../../data/guideHotelPicks.json" with { type: "json" };
import guidePlacePhotos from "../../data/guidePlacePhotos.json" with { type: "json" };
import { GUIDE_TOWNS, COST_TWINS, COST_TWIN_LABEL, US_BAND_SOURCE, townId } from "../../data/guideTowns.js";
import { destinations } from "../../data/destinations.js";
import { publishedDestinations } from "../../data/destinationCatalog.js";
import { GUIDES, GUIDE_CENTERS } from "../../data/guides.js";
import { estimateTrip } from "../recommendation/tripEstimate.js";
import { curatedActivities, curatedRestaurants } from "../places/curated.js";
import { formatMoney, sizedPhoto } from "../format.js";
import { RESORT_ECONOMIES } from "../../data/destinationPlanningAverages.js";
import { displayName } from "../../data/trending.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const NIGHTS = { weekend: 2, hotels: 2, feature: 2, budget: 4 };
const DAY_NAMES = { weekend: ["Saturday", "Sunday"], hotels: ["Saturday", "Sunday"], feature: ["Saturday", "Sunday"] };
const MAX_NIGHTS = 14;
const KIND_LABEL = { weekend: "Weekend", hotels: "Cheap hotels", feature: "Hotels", budget: "On a budget", list: "List", versus: "Side by side" };
const MAX_TRAVELERS = 8;

const byId = new Map(destinations.map((item) => [item.id, item]));
const pageById = new Map(publishedDestinations.map((item) => [item.id, item]));

// Towns outside the catalog: their own location, airport, photo, stays and
// weather; food, activities and transport from the matching US cost profile.
const townStays = new Map();
for (const [key, town] of Object.entries(GUIDE_TOWNS)) {
  const id = townId(key);
  const twin = byId.get(COST_TWINS[town.costs]);
  const data = guideTownData.towns?.[key] || {};
  if (!twin || !data.image) continue;
  byId.set(id, { ...twin, id, town: key, name: `${town.name.toUpperCase()}, UNITED STATES`, city: town.name.toUpperCase(), latitude: town.latitude, longitude: town.longitude, airport: town.airport, image: data.image.url, avoidMonths: [], costTwin: twin.id });
  pageById.set(id, { id, name: town.name, slug: pageById.get(town.parent)?.slug || null, alt: `${town.name}, ${town.state}`, country: "United States", continent: "North America", state: town.state, parent: town.parent || null, credit: data.image });
  townStays.set(id, guideStays.towns?.[key]?.stays || []);
}
const staysFor = (id) => townStays.get(id) || feedStays.stays?.[id] || [];
// A guide's own photo (app/data/guideTowns.js GUIDE_PHOTOS), else its place's.
const guidePhoto = (guide) => guide.photo ? guideTownData.photos?.[guide.photo] || null : null;
const climateFor = (id) => climate.climate?.[id] || guideTownData.towns?.[byId.get(id)?.town]?.climate || null;

export function km(a, b) {
  if (!a || !b || a.latitude == null || b.latitude == null) return null;
  const rad = (value) => value * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude); const dLon = rad(b.longitude - a.longitude);
  return 6371 * 2 * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2));
}

function walk(distance) {
  if (distance == null) return null;
  if (distance < 0.15) return "next door";
  if (distance <= 1.8) return `about ${Math.max(2, Math.round(distance * 12.5))} min on foot`;
  return `${distance.toFixed(distance < 10 ? 1 : 0)} km away, so take transit or a ride`;
}

function from(distance, name) {
  if (distance == null) return null;
  return distance < 1 ? `${Math.round(distance * 1000 / 50) * 50} m from ${name}` : `${distance.toFixed(1)} km from ${name}`;
}

function centerOf(guide, destination) {
  if (guide.area?.latitude != null) return guide.area;
  if (destination?.latitude != null) return { latitude: destination.latitude, longitude: destination.longitude };
  return GUIDE_CENTERS[destination?.id] || null;
}

// ---- Stays -----------------------------------------------------------------

const HIGHLIGHTS = [
  [/^free wifi$/i, "Free WiFi"],
  [/^hot tub$/i, "Hot tub"],
  [/^beachfront$/i, "Beachfront"],
  [/kitchen/i, "Kitchen"],
  [/^outdoor pool|^indoor pool|^swimming pool/i, "Pool"],
  [/^pets allowed$/i, "Pets allowed"],
  [/^free parking$/i, "Free parking"],
  [/^airport shuttle/i, "Airport shuttle"],
  [/^fitness/i, "Gym"],
  [/^lockers$/i, "Lockers"],
  [/^shared kitchen$/i, "Shared kitchen"],
  [/^24-hour front desk$/i, "24-hour desk"],
];

const BUDGET_TYPES = /hostel|guest ?house|inn|motel|capsule|bed and breakfast|homestay|aparthotel|hotel|lodge|apartment/i;
const LUXURY = /resort|villa|luxury/i;
// Rental listings named like an ad ("Cozy 1BR Retreat Near Downtown"), not a property.
const LISTING = /\b\d\s?BR\b|\bretreat\b|\bw\/? (dedicated|private|hot tub|king)|\bEZ ?access\b| - .+ - |^(cozy|modern|charming|spacious|bright|stylish)\b/i;
const STRIP = [{ latitude: 36.0905, longitude: -115.1745 }, { latitude: 36.1475, longitude: -115.1566 }];

function distanceToStrip(point) {
  // Shortest distance to the Strip, sampled along Las Vegas Boulevard.
  let best = Infinity;
  for (let step = 0; step <= 20; step += 1) {
    const t = step / 20;
    const sample = { latitude: STRIP[0].latitude + (STRIP[1].latitude - STRIP[0].latitude) * t, longitude: STRIP[0].longitude + (STRIP[1].longitude - STRIP[0].longitude) * t };
    best = Math.min(best, km(sample, point));
  }
  return best;
}

const text = (stay) => [stay.description, ...(stay.roomTypes || []), ...(stay.amenities || [])].join(" | ");

// Evidence for a feature, in the stay's own feed words. No evidence, no claim.
const FEATURES = {
  oceanfront: (stay) => {
    if ((stay.amenities || []).some((item) => /^beachfront$/i.test(item))) return "Listed as beachfront on Booking.com";
    const room = (stay.roomTypes || []).find((item) => /ocean ?front|ocean view|sea view/i.test(item));
    if (room) return `Has a "${room}"`;
    if (/oceanfront|beachfront|on the beach/i.test(stay.description || "")) return "Booking.com describes it as oceanfront";
    return null;
  },
  romantic: (stay) => {
    if ((stay.amenities || []).some((item) => /^hot tub$/i.test(item))) return "Hot tub";
    const room = (stay.roomTypes || []).find((item) => /ocean view|sea view|ocean ?front|fireplace|spa bath|jacuzzi/i.test(item));
    if (room) return `Has a "${room}"`;
    if (/adults only/i.test(text(stay))) return "Adults only";
    return null;
  },
  offStrip: (stay) => {
    const distance = distanceToStrip(stay);
    return distance >= 1 && distance <= 15 ? `${distance.toFixed(1)} km off the Strip` : null;
  },
};

// The feed marks some full hotels as having dorms; only hostels and capsule
// hotels are treated as dorm stays.
const isDorm = (stay) => Boolean(stay.dorms) && /hostel|capsule/i.test(stay.category || "");

function stayType(stay) {
  const kind = String(stay.category || "stay").toLowerCase();
  return stay.starRating ? `${stay.starRating}-star ${kind}` : kind.charAt(0).toUpperCase() + kind.slice(1);
}

// The master list's lodging band for a place, by stay type (yearly averages).
function bandFor(destination) {
  if (RESORT_ECONOMIES.has(destination.id)) return null;
  return lodgingBands.bands?.[destination.town ? US_BAND_SOURCE : destination.id] || null;
}

function nightPrice(stay, destination, month) {
  // Typical price for this kind of stay here, never a quote for the property.
  const band = bandFor(destination);
  const stars = Number(stay.starRating) || 0;
  if (band) {
    if (isDorm(stay)) return band.dormBed ? { value: Math.round(band.dormBed), unit: "dorm bed", kind: "hostel" } : null;
    if (stars >= 4) return { value: Math.round(band.fourStar), unit: "room", kind: "4-star" };
    if (stars === 3) return { value: Math.round(band.threeStar), unit: "room", kind: "3-star" };
    return { value: Math.round(band.budgetHotel), unit: "room", kind: "budget" };
  }
  if (isDorm(stay) || stars >= 4) return null;
  const night = destination.planningAverages?.monthly?.[month - 1]?.hotelNight;
  return night ? { value: Math.round(night), unit: "room", kind: "good-value" } : null;
}

// Hand-picked hotels for this guide's place (3 cheap, 3 mid-range, 3 splurge),
// matched to Booking.com listings in the CJ feed. Prices are the place's typical
// nightly price for each tier, never the hotel's own rate.
const PICK_TIERS = [
  ["cheap", "Cheap", ["budgetHotel"], "a budget hotel"],
  ["average", "Mid-range", ["threeStar"], "a 3-star hotel"],
  ["expensive", "Splurge", ["fourStar", "luxury"], "a 4-star to luxury hotel"],
];
function hotelPicks(guide, destination) {
  const place = Object.values(guideHotelPicks.places || {}).find((item) => item.guides.includes(guide.slug));
  if (!place || place.hotels.length < 3) return null;
  const band = bandFor(destination);
  const tiers = PICK_TIERS.map(([key, label, fields, kind]) => {
    const values = fields.map((field) => Math.round(band?.[field] || 0)).filter(Boolean);
    return {
      key,
      label,
      price: values.length === fields.length ? { low: values[0], high: values.at(-1), kind, where: destination.town ? "this region" : null } : null,
      hotels: place.hotels.filter((hotel) => hotel.tier === key && hotel.photos?.length && hotel.cjClickUrl).map(({ pickedAs, latitude, longitude, ...hotel }) => hotel),
    };
  }).filter((tier) => tier.hotels.length);
  return tiers.length >= 2 ? { tiers, checkedAt: guideHotelPicks.checkedAt } : null;
}

const DINNER = (guide, center) => (item) => ({
  name: item.name,
  category: titleCase(item.category),
  rating: item.rating,
  reviewCount: item.reviewCount,
  price: mealPrice(item.priceRange) || { ...PRICE, PRICE_LEVEL_EXPENSIVE: "$$$", PRICE_LEVEL_VERY_EXPENSIVE: "$$$$" }[item.priceLevel] || null,
  distance: guide.area && !guide.area.town ? from(km(center, item), guide.area.name) : null,
  googleMapsUrl: item.googleMapsUrl,
});
const cheapMeal = (item) => item.priceLevel === "PRICE_LEVEL_INEXPENSIVE" || Boolean(item.priceRange?.high && item.priceRange.high <= 20 && ["USD", "EUR", "GBP", "CAD", "AUD", "CHF"].includes(item.priceRange.currency));

// The page's budget switch: Budget, Mid-range and Splurge each get their own
// hotels and dinners. Hotel prices are the place's typical nightly price for
// that kind of hotel, never a hotel's own rate.
function budgetLevels(guide, destination, center, stays) {
  const band = bandFor(destination);
  const own = areaPlaces(guide);
  const city = guidePlaces.areas?.[`${guide.destinationId}:all`] || {};
  const dinners = dedupe([...(own.dinners || []), ...nearest(city.dinners || [], center, 10)]).filter((item) => item.googleMapsUrl);
  const splurgeDinners = dedupe([...(own.splurgeDinners || []), ...nearest(city.splurgeDinners || [], center, 10)]).filter((item) => item.googleMapsUrl);
  const cheap = dinners.filter(cheapMeal);
  const middle = dinners.filter((item) => !cheapMeal(item));
  const picks = hotelPicks(guide, destination);
  const pickStays = (key, price) => (picks?.tiers.find((tier) => tier.key === key)?.hotels || []).map((hotel) => ({
    id: hotel.id,
    name: hotel.name,
    type: hotel.starRating ? `${hotel.starRating}-star ${String(hotel.category || "hotel").toLowerCase()}` : hotel.category || "Hotel",
    photo: hotel.photos[0],
    address: hotel.address,
    distance: null,
    evidence: null,
    highlights: [],
    freeCancellation: hotel.catalogFreeCancellation === true,
    breakfast: hotel.catalogFreeBreakfast === true,
    dorms: false,
    price,
    bookingUrl: hotel.bookingUrl,
    cjTrackingBaseUrl: (() => { try { const url = new URL(hotel.cjClickUrl); return `${url.origin}${url.pathname}`; } catch { return null; } })(),
  }));
  // Budget shows budget stays only, never a hotel that's in another level.
  const upper = new Set([...pickStays("average", null), ...pickStays("expensive", null)].map((stay) => stay.name.toLowerCase()));
  const notUpper = stays.picks.filter((stay) => !upper.has(stay.name.toLowerCase()));
  const budgetOnly = notUpper.filter((stay) => !/3-star|4-star/.test(stay.price?.kind || ""));
  const budgetStays = (budgetOnly.length >= 2 ? budgetOnly : notUpper.length >= 2 ? notUpper : stays.picks).slice(0, 3);
  const budgetDinners = [...cheap, ...middle].slice(0, 3);
  const shown = new Set(budgetDinners.map((item) => item.name));
  const midDinners = [...middle, ...cheap].filter((item) => !shown.has(item.name));
  const night = (value, high, kind) => (band && value ? { value: Math.round(value), high: high ? Math.round(high) : null, unit: "room", kind } : null);
  const levels = [
    { key: "budget", label: "Budget", sign: "$", stays: budgetStays, dinners: budgetDinners, lodging: band ? [band.budgetHotelRange?.[0] || band.budgetHotel, band.budgetHotel] : null },
    { key: "mid", label: "Mid-range", sign: "$$", stays: pickStays("average", night(band?.threeStar, null, "3-star")), dinners: (midDinners.length ? midDinners : budgetDinners).slice(0, 3), lodging: band ? [band.threeStar, band.threeStar] : null },
    { key: "splurge", label: "Splurge", sign: "$$$", stays: pickStays("expensive", night(band?.fourStar, band?.luxury, "4-star to luxury")), dinners: (splurgeDinners.length ? splurgeDinners : middle).slice(0, 3), lodging: band ? [band.fourStar, band.luxury] : null },
  ];
  return levels.filter((level) => level.stays.length).map((level) => ({ ...level, dinners: level.dinners.map(DINNER(guide, center)) }));
}

function pickStays(guide, destination, center, month) {
  const all = staysFor(destination.id).filter((stay) => stay.photos?.length && (stay.cjClickUrl || stay.bookingUrl));
  let pool = all;
  if (guide.area?.town) pool = pool.filter((stay) => stay.city === guide.area.town);
  else if (guide.area?.radiusKm) pool = pool.filter((stay) => km(guide.area, stay) != null && km(guide.area, stay) <= guide.area.radiusKm);
  const feature = guide.feature ? FEATURES[guide.feature] : null;
  const scored = pool
    .map((stay) => ({ stay, evidence: feature ? feature(stay) : null, distance: km(center, stay) }))
    .filter(({ stay, evidence }) => (!feature || evidence) && !LISTING.test(stay.name) && BUDGET_TYPES.test(stay.category || "hotel") && !LUXURY.test(stay.category || "") && !(Number(stay.starRating) > 4));
  // Budget first; among equals, closer to the area.
  // Budget first (4-star stays only when there aren't enough cheaper ones); among equals, closer to the area.
  scored.sort((a, b) => (Number(a.stay.starRating) >= 4) - (Number(b.stay.starRating) >= 4) || (b.stay.budgetScore || 0) - (a.stay.budgetScore || 0) || (a.distance ?? 99) - (b.distance ?? 99));
  // Mix types where possible: no more than two hostels.
  const picks = [];
  for (const entry of scored) {
    if (picks.length >= 4) break;
    if (isDorm(entry.stay) && picks.filter((pick) => isDorm(pick.stay)).length >= 2) continue;
    picks.push(entry);
  }
  for (const entry of scored) if (picks.length < 4 && !picks.includes(entry)) picks.push(entry);
  return {
    total: pool.length,
    matching: scored.length,
    picks: picks.map(({ stay, evidence, distance }) => ({
      id: stay.id,
      name: stay.name,
      type: stayType(stay),
      photo: stay.photos[0],
      address: stay.streetAddress || stay.address || null,
      distance: guide.area && !guide.area.town ? from(distance, guide.area.name) : null,
      evidence,
      highlights: [...new Set((stay.amenities || []).flatMap((item) => HIGHLIGHTS.filter(([pattern]) => pattern.test(item)).map(([, label]) => label)))].slice(0, 4),
      freeCancellation: stay.catalogFreeCancellation === true,
      breakfast: stay.catalogFreeBreakfast === true,
      dorms: isDorm(stay),
      maxGuests: stay.maxGuests || null,
      price: nightPrice(stay, destination, month),
      bookingUrl: stay.bookingUrl,
      cjTrackingBaseUrl: stay.cjTrackingBaseUrl || null,
      latitude: stay.latitude,
      longitude: stay.longitude,
    })),
    dormCount: pool.filter(isDorm).length,
    freeCancellationCount: pool.filter((stay) => stay.catalogFreeCancellation === true).length,
    pool,
  };
}

// ---- Places ------------------------------------------------------------------

const PRICE = { PRICE_LEVEL_INEXPENSIVE: "$", PRICE_LEVEL_MODERATE: "$$" };
const titleCase = (value) => String(value || "").replace(/\b\w/g, (letter) => letter.toUpperCase());

function areaPlaces(guide) {
  return guidePlaces.areas?.[`${guide.destinationId}:${guide.area?.name || "all"}`] || { dinners: [], activities: [] };
}

function nearest(list, center, count, maxKm = 30) {
  return list
    .filter((item) => item.googleMapsUrl && (km(center, item) ?? 0) <= maxKm)
    .map((item) => ({ ...item, distance: km(center, item) }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((item) => {
    const key = item.googlePlaceId || item.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const SYMBOL = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "CA$", AUD: "A$" };
// Google's per-person range, in the restaurant's currency ("€10–20", "under 200 THB").
function mealPrice(range) {
  if (!range?.high) return null;
  const money = (value) => SYMBOL[range.currency] ? `${SYMBOL[range.currency]}${value}` : `${value} ${range.currency}`;
  return `${range.low > 1 ? `${money(range.low)}–${SYMBOL[range.currency] ? range.high : money(range.high)}` : `under ${money(range.high)}`} per person`;
}

function dinnersFor(guide, center) {
  const own = areaPlaces(guide).dinners || [];
  const city = guidePlaces.areas?.[`${guide.destinationId}:all`]?.dinners || [];
  const curated = curatedRestaurants(guide.destinationId).filter((item) => !["PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"].includes(item.priceLevel));
  const list = dedupe([...own, ...nearest([...city, ...curated], center, 10)]).slice(0, 5);
  return list.map((item) => ({
    name: item.name,
    category: titleCase(item.category),
    rating: item.rating,
    reviewCount: item.reviewCount,
    price: mealPrice(item.priceRange) || PRICE[item.priceLevel] || null,
    distance: guide.area && !guide.area.town ? from(km(center, item), guide.area.name) : null,
    googleMapsUrl: item.googleMapsUrl,
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}

function activitiesFor(guide, center) {
  const own = areaPlaces(guide).activities || [];
  const city = guidePlaces.areas?.[`${guide.destinationId}:all`]?.activities || [];
  const curated = curatedActivities(guide.destinationId);
  const list = dedupe([...own, ...nearest([...city, ...curated], center, 12)]).slice(0, 10);
  const photoOf = (item) => guidePlacePhotos.photos?.[item.googlePlaceId] || null;
  return [...list.filter(photoOf), ...list.filter((item) => !photoOf(item))].map((item) => ({
    name: item.name,
    photo: photoOf(item) ? { url: sizedPhoto(photoOf(item).url, 800), artist: photoOf(item).artist, license: photoOf(item).license, licenseUrl: photoOf(item).licenseUrl, source: photoOf(item).source } : null,
    category: titleCase(item.category),
    rating: item.rating,
    reviewCount: item.reviewCount,
    googleMapsUrl: item.googleMapsUrl,
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}

// Each day walks from one stop to the nearest unvisited one.
function buildPlan(kind, start, activities, dinners) {
  const days = kind === "budget" ? 4 : 2;
  const names = DAY_NAMES[kind] || Array.from({ length: days }, (_, index) => `Day ${index + 1}`);
  const left = [...activities];
  const dinnersLeft = [...dinners];
  let here = start;
  const take = (list) => {
    if (!list.length) return null;
    list.sort((a, b) => (km(here, a) ?? 0) - (km(here, b) ?? 0));
    const next = list.shift();
    const distance = km(here, next);
    here = next.latitude != null ? next : here;
    return { ...next, getThere: walk(distance) };
  };
  return names.map((name) => {
    here = start;
    const morning = take(left);
    const afternoon = take(left);
    const evening = take(dinnersLeft);
    return { name, slots: [["Morning", morning], ["Afternoon", afternoon], ["Evening", evening]].filter(([, stop]) => stop) };
  }).filter((day) => day.slots.length >= 2);
}

// ---- Costs -------------------------------------------------------------------

// Every nights × travelers combination, from the same estimate the planner uses.
// With a lodging band, lodging runs from the band's low end to its average
// budget-hotel night, one room per two travelers.
function lodging(band, nights, travelers) {
  const rooms = Math.ceil(travelers / 2);
  const round = (value) => Math.round(value / 10) * 10;
  return [round((band.budgetHotelRange?.[0] || band.budgetHotel) * nights * rooms), round(band.budgetHotel * nights * rooms)];
}

// The site's trip estimate, with lodging from the regional band where there is one,
// so the totals agree with the per-night prices shown on the stays.
export function guideEstimate(destination, { nights, travelers, startDate }) {
  const band = bandFor(destination);
  const estimate = estimateTrip(destination, { nights, travelers, ...(startDate ? { startDate } : {}) });
  const breakdown = estimate.breakdown.map((item) => item.key === "hotel" && band ? { ...item, ...Object.fromEntries([["low", lodging(band, nights, travelers)[0]], ["high", lodging(band, nights, travelers)[1]]]) } : item);
  return { ...estimate, breakdown, low: breakdown.reduce((total, item) => total + item.low, 0), high: breakdown.reduce((total, item) => total + item.high, 0) };
}

function costGrid(destination, month) {
  const band = bandFor(destination);
  const year = new Date().getUTCFullYear() + (month <= new Date().getUTCMonth() + 1 ? 1 : 0);
  const startDate = `${year}-${String(month).padStart(2, "0")}-12`;
  const grid = [];
  for (let nights = 1; nights <= MAX_NIGHTS; nights += 1) {
    const row = [];
    for (let travelers = 1; travelers <= MAX_TRAVELERS; travelers += 1) {
      row.push(guideEstimate(destination, { nights, travelers, startDate }).breakdown.map((item) => [item.low, item.high]));
    }
    grid.push(row);
  }
  const labels = estimateTrip(destination, { nights: 2, travelers: 2, startDate }).breakdown.map((item) => item.label);
  const town = destination.town ? GUIDE_TOWNS[destination.town] : null;
  const lodgingSource = town
    ? `Lodging uses the master list's general US budget-hotel band (shared by ${band.sharedBy} US places), one room per two travelers. Food, activities and local transport use GlobTrek's estimate for ${COST_TWIN_LABEL[town.costs]}.`
    : band ? `Lodging uses the master list's budget-hotel band for this region (shared by ${band.sharedBy} place${band.sharedBy === 1 ? "" : "s"}), one room per two travelers.` : "Lodging uses GlobTrek's cost model for this place.";
  const lodgingIndex = estimateTrip(destination, { nights: 2, travelers: 2, startDate }).breakdown.findIndex((item) => item.key === "hotel");
  return { labels, grid, lodgingSource, lodgingIndex };
}

function bestMonth(destination) {
  const months = destination.planningAverages?.monthly || [];
  if (!months.length) return null;
  const avoid = new Set(destination.avoidMonths || []);
  const options = months.filter((item) => !avoid.has(item.month));
  const low = [...(options.length ? options : months)].sort((a, b) => a.hotelNight - b.hotelNight)[0];
  const high = [...months].sort((a, b) => b.hotelNight - a.hotelNight)[0];
  return { low, high };
}

function temperature(destinationId, month) {
  const value = climateFor(destinationId)?.t2m?.[month - 1];
  return value == null ? null : Math.round(value);
}

// Per-place climate (NASA POWER averages): warmest, coolest and wettest months.
function weather(destinationId) {
  const data = climateFor(destinationId);
  if (!data?.t2m?.length) return null;
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const months = data.t2m.map((temp, index) => ({ month: index + 1, temp: Math.round(temp), rain: Math.round((data.precip?.[index] || 0) * days[index]) }));
  const warm = [...months].sort((a, b) => b.temp - a.temp)[0];
  const cool = [...months].sort((a, b) => a.temp - b.temp)[0];
  const wet = [...months].sort((a, b) => b.rain - a.rain)[0];
  const dry = [...months].sort((a, b) => a.rain - b.rain)[0];
  return { months, warm, cool, wet, dry };
}

function goodWeather(destinationId, month) {
  const data = climateFor(destinationId);
  if (!data?.t2m) return false;
  const temp = data.t2m[month - 1];
  return temp >= 15 && temp <= 32 && (data.precip?.[month - 1] ?? 0) < 4;
}

function airportLine(destination, center) {
  const code = destination.airport;
  const coords = airportCoords[code];
  if (!code || !coords || !center) return null;
  const distance = km({ latitude: coords[0], longitude: coords[1] }, center);
  return { code, distance: Math.round(distance) };
}

// ---- Guides ------------------------------------------------------------------

const fmt = (low, high) => `${formatMoney(low)}–${formatMoney(high)}`;
const sum = (rows) => rows.reduce((total, [low, high]) => [total[0] + low, total[1] + high], [0, 0]);
const people = (count) => `${count} traveler${count === 1 ? "" : "s"}`;
const tripName = (guide, nights) => guide.kind === "budget" ? `${nights}-night trip to ${guide.place}` : `weekend in ${guide.place}`;

function relatedFor(guide) {
  const destination = byId.get(guide.destinationId);
  const page = pageById.get(guide.destinationId);
  const score = (other) => {
    if (other.slug === guide.slug) return -1;
    let points = 0;
    if (guide.destinationId && other.destinationId === guide.destinationId) points += 5;
    if (guide.versus?.includes(other.destinationId) || other.versus?.includes(guide.destinationId)) points += 4;
    const otherPage = pageById.get(other.destinationId);
    if (page && otherPage && otherPage.country === page.country) points += 3;
    if (page && otherPage && otherPage.continent === page.continent) points += 1;
    // Towns: same state, or the catalog destination they belong to.
    if (page?.state && otherPage?.state === page.state) points += 3;
    if (page?.parent && (other.destinationId === page.parent || otherPage?.parent === page.parent)) points += 2;
    if (otherPage?.parent && other.destinationId !== guide.destinationId && guide.destinationId === otherPage.parent) points += 2;
    if (other.kind === guide.kind) points += 1;
    if (!destination && other.kind === "list") points += 2;
    return points;
  };
  return GUIDES.map((other) => [other, score(other)]).filter(([, points]) => points > 0)
    .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([other]) => ({ slug: other.slug, title: other.title }));
}

function placeGuide(guide) {
  const destination = byId.get(guide.destinationId);
  const page = pageById.get(guide.destinationId);
  if (!destination || !page) return null;
  const center = centerOf(guide, destination);
  const month = new Date().getUTCMonth() + 1;
  const stays = pickStays(guide, destination, center, month);
  if (stays.picks.length < 4) return null;
  const nights = NIGHTS[guide.kind] || 2;
  const travelers = guide.kind === "budget" ? 1 : 2;
  const activities = activitiesFor(guide, center);
  const dinners = dinnersFor(guide, center);
  const plan = buildPlan(guide.kind, center || stays.picks[0], activities, dinners);
  const costs = costGrid(destination, month);
  const [low, high] = sum(costs.grid[nights - 1][travelers - 1]);
  const months = bestMonth(destination);
  const top = stays.picks[0];
  const near = guide.area ? null : (() => {
    // Where the budget stays cluster: the sight nearest their middle.
    const located = stays.pool.filter((stay) => stay.latitude != null).sort((a, b) => (b.budgetScore || 0) - (a.budgetScore || 0)).slice(0, 20);
    if (located.length < 5 || !activities.length) return null;
    const middle = { latitude: located.map((stay) => stay.latitude).sort((a, b) => a - b)[Math.floor(located.length / 2)], longitude: located.map((stay) => stay.longitude).sort((a, b) => a - b)[Math.floor(located.length / 2)] };
    const sight = [...activities].sort((a, b) => (km(middle, a) ?? 99) - (km(middle, b) ?? 99))[0];
    const within = located.filter((stay) => km(sight, stay) <= 1.5).length;
    return km(middle, sight) <= 2.5 && within >= Math.max(6, located.length * 0.3) ? { name: sight.name, within, of: located.length } : null;
  })();
  const airport = airportLine(destination, center);
  const temp = temperature(destination.id, month);
  const nightUnit = top.price?.unit || "room";
  const priced = stays.picks.find((pick) => pick.price?.unit === "room")?.price || stays.picks.find((pick) => pick.price)?.price;

  const where = guide.area
    ? `${stays.matching} budget stays ${guide.area.town ? `in ${guide.area.name}` : `within ${guide.area.radiusKm} km of ${guide.area.name}`} are on Booking.com in our data`
    : near ? `The cheapest well-equipped stays cluster around ${near.name}: ${near.within} of the ${near.of} we rank highest are within 1.5 km of it` : null;
  const featureNote = guide.feature === "oceanfront" ? `${stays.matching} of them show oceanfront or ocean-view rooms` : guide.feature === "romantic" ? `${stays.matching} have a hot tub, an ocean-view room or a fireplace` : guide.feature === "offStrip" ? `${stays.matching} are 1 to 15 km off the Strip` : null;
  const costLine = `A ${tripName(guide, nights)} costs about ${fmt(low, high)} for ${people(travelers)} before getting there, with ${priced ? `${priced.unit === "dorm bed" ? "dorm beds" : `${priced.kind} rooms`} typically around ${formatMoney(priced.value)} a night` : "budget stays"}.`;
  const whereLine = [where, featureNote].filter(Boolean).join("; ") + (where || featureNote ? "." : "");
  const pickLine = `Top pick: ${top.name}, ${/^[aeiou8]|^1[18]-/i.test(top.type) ? "an" : "a"} ${top.type.toLowerCase()}${top.dorms ? " with dorm beds" : ""}${top.distance ? ` ${top.distance}` : ""}${top.freeCancellation ? ", with free cancellation on some rates" : ""}.`;
  // Hotel searches lead with the stays; trip searches lead with the cost.
  const cheapest = [...stays.picks].filter((pick) => pick.price).sort((a, b) => a.price.value - b.price.value)[0];
  const hotelLine = cheapest ? `The cheapest kind of stay here is ${cheapest.dorms ? "a dorm bed" : `a ${cheapest.price.kind} room`}, typically about ${formatMoney(cheapest.price.value)} a night; two nights for ${people(travelers)} with food and getting around come to about ${fmt(low, high)}.` : costLine;
  const quick = (["hotels", "feature"].includes(guide.kind) ? [whereLine, pickLine, hotelLine] : [costLine, whereLine, pickLine]).filter((line) => line && line !== ".");

  const faqs = [];
  faqs.push([`How much does a ${tripName(guide, nights)} cost?`, `About ${fmt(low, high)} for ${people(travelers)} in ${MONTHS[month - 1]}: ${costs.labels.map((label, index) => `${label.toLowerCase()} ${fmt(...costs.grid[nights - 1][travelers - 1][index])}`).join(", ")}. That's before flights or driving there, from GlobTrek's cost model for ${destination.town ? `${COST_TWIN_LABEL[GUIDE_TOWNS[destination.town].costs]} with US hotel prices` : page.name}; live prices are on Booking.com.`]);
  const sky = weather(destination.id);
  if (sky) faqs.push([`What's the weather like in ${guide.place}?`, `Warmest in ${MONTHS[sky.warm.month - 1]} (about ${sky.warm.temp} °C on average) and coolest in ${MONTHS[sky.cool.month - 1]} (about ${sky.cool.temp} °C). ${MONTHS[sky.wet.month - 1]} is the wettest month, with about ${sky.wet.rain} mm of rain, and ${MONTHS[sky.dry.month - 1]} the driest. ${MONTHS[month - 1]} averages ${sky.months[month - 1].temp} °C. Averages from NASA POWER, 2001–2025.`]);
  if (guide.feature === "oceanfront" || guide.feature === "romantic") {
    faqs.push([guide.feature === "oceanfront" ? `Which ${guide.place} hotels are oceanfront?` : "Which stays suit a romantic weekend?", `${stays.picks.map((pick) => `${pick.name} (${pick.evidence.charAt(0).toLowerCase()}${pick.evidence.slice(1)})`).join(", ")}. Each one is from its Booking.com listing; check the room you book has the view or hot tub.`]);
  } else if (guide.area && !guide.area.town) {
    faqs.push([`Are there cheap hotels near ${guide.area.name}?`, `Yes. ${stays.matching} budget stays are within ${guide.area.radiusKm} km of ${guide.area.name}${stays.dormCount ? `, ${stays.dormCount} of them with dorm beds` : ""}. The closest of our picks is ${[...stays.picks].sort((a, b) => (km(center, a) ?? 9) - (km(center, b) ?? 9))[0].name}.`]);
  } else {
    faqs.push([`Where should I stay in ${guide.place} on a budget?`, `${where ? `${where}.` : `${stays.matching} budget stays are listed for ${guide.place}.`} ${stays.dormCount ? `${stays.dormCount} of them have dorm beds for the lowest price.` : "None have dorm beds, so a simple room is the cheapest option."}`]);
  }
  if (stays.freeCancellationCount) faqs.push(["Can I cancel for free?", `${stays.freeCancellationCount} of the ${stays.total} stays we list here offer free cancellation on at least some rates. The terms are set per rate on Booking.com, so check before you book.`]);
  if (airport) faqs.push([`How far is the airport?`, `${airport.code} is about ${airport.distance} km from ${guide.area?.name || `central ${page.name}`}.${temp != null ? ` Expect around ${temp} °C on average in ${MONTHS[month - 1]}.` : ""}`]);

  return {
    ...guide,
    h1: guide.title,
    description: `${guide.title}: ${fmt(low, high)} for ${people(travelers)}, ${nights} nights, before travel. ${stays.picks.length} real budget stays${guide.area ? ` ${guide.area.town ? "in" : "near"} ${guide.area.name}` : ""}, cheap dinners and a ${plan.length}-day plan.`,
    image: sizedPhoto(guidePhoto(guide)?.url || destination.image, 1600),
    imageAlt: guidePhoto(guide) ? `${guide.place}, ${page.state || page.country}` : page.alt,
    label: KIND_LABEL[guide.kind],
    chips: [`${nights} nights`, KIND_LABEL[guide.kind]],
    estimate: { low, high, nights, travelers },
    facts: [
      [tripName(guide, nights).replace(/^./, (letter) => letter.toUpperCase()), `${fmt(low, high)}`, `${people(travelers)}, before travel`],
      cheapest ? [cheapest.dorms ? "Dorm bed" : `Typical ${cheapest.price.kind} room`, `about ${formatMoney(cheapest.price.value)}`, "a night, not a quote"] : null,
      ["Top pick", top.name, top.type],
    ].filter(Boolean),
    country: page.state ? `${page.state}, ${page.country}` : page.country === "United States" && destination.region && !/united states/i.test(destination.region) ? `${destination.region}, ${page.country}` : page.country,
    destinationSlug: page.slug,
    quick,
    stays: stays.picks,
    hotelPicks: hotelPicks(guide, destination),
    budgets: budgetLevels(guide, destination, center, stays).map(({ stays: levelStays, ...level }) => ({ ...level, stays: levelStays.map(({ latitude, longitude, ...stay }) => stay) })),
    stayNote: `Prices are typical nights for this kind of stay in ${page.name} (${bandFor(destination) ? "yearly averages from GlobTrek's regional price bands" : `GlobTrek's ${MONTHS[month - 1]} estimate`}), not the property's own rate. Dorm prices are per bed. Tap through for today's price.`,
    plan,
    dinners,
    activities,
    costs: { ...costs, nights, travelers, month: MONTHS[month - 1] },
    faqs: faqs.slice(0, 5),
    related: relatedFor(guide),
    quizHref: destination.town ? (page.parent ? `/discover/quick?destination=${page.parent}&destinationName=${encodeURIComponent(pageById.get(page.parent)?.name || page.name)}&source=guide` : "/discover") : `/discover/quick?destination=${destination.id}&destinationName=${encodeURIComponent(page.name)}&source=guide`,
    imageCredit: (({ artist, license, licenseUrl, source } = {}) => artist ? { artist, license, licenseUrl, source } : null)(guidePhoto(guide) || page.credit || undefined),
  };
}

// ---- Lists -------------------------------------------------------------------

const WEST_COAST = ["LAX", "SFO", "SEA", "PDX", "SAN", "OAK", "SJC"];

function observedFare(origin, airport) {
  const route = fareIndex.routes?.[`${origin}-${airport}`];
  if (!route) return null;
  const months = Object.entries(route).filter(([key, value]) => /^\d+$/.test(key) && Array.isArray(value));
  if (!months.length) return null;
  const [month, [, median, low, , samples]] = months.sort((a, b) => a[1][1] - b[1][1])[0];
  return { origin, month: Number(month), median, low, samples };
}

function topStay(destinationId) {
  const stay = staysFor(destinationId).filter((item) => item.photos?.length).sort((a, b) => (b.budgetScore || 0) - (a.budgetScore || 0))[0];
  return stay ? { name: stay.name, type: stayType(stay), bookingUrl: stay.bookingUrl, cjTrackingBaseUrl: stay.cjTrackingBaseUrl || null } : null;
}

function listGuide(guide) {
  const rule = guide.list;
  const month = rule.month || (rule.warmWinter ? 1 : new Date().getUTCMonth() + 1);
  const nights = rule.nights || 5;
  const year = new Date().getUTCFullYear() + (month <= new Date().getUTCMonth() + 1 ? 1 : 0);
  const startDate = `${year}-${String(month).padStart(2, "0")}-12`;
  // Ranked only where lodging comes from a regional band or an editorial city
  // budget, so every place is priced on the same footing.
  let pool = publishedDestinations.filter((page) => (feedStays.stays?.[page.id] || []).length >= 3 && !(rule.exclude || []).includes(page.id) && (bandFor(byId.get(page.id)) || byId.get(page.id)?.planningAverages?.model === "city"));
  const why = {};
  // Leave out poor-weather months and places far below freezing (high passes and treks).
  // Month lists: places with good weather that month (15–32 °C, under about 4 mm
  // of rain a day, not a month GlobTrek flags to avoid), then cheapest first.
  if (rule.month) pool = pool.filter((page) => !(byId.get(page.id)?.avoidMonths || []).includes(rule.month) && goodWeather(page.id, rule.month));
  if (rule.warmWinter) pool = pool.filter((page) => {
    const temps = climate.climate?.[page.id]?.t2m;
    if (!temps) return false;
    const winter = (temps[11] + temps[0] + temps[1]) / 3;
    why[page.id] = `${Math.round(winter)} °C average, December to February`;
    return winter >= 22;
  });
  if (rule.continent) pool = pool.filter((page) => page.continent === rule.continent);
  if (rule.city) pool = pool.filter((page) => byId.get(page.id)?.destinationType === "city");
  if (rule.minKnownness) pool = pool.filter((page) => (page.knownness ?? 0) >= rule.minKnownness);
  if (rule.country) pool = pool.filter((page) => page.country === rule.country);
  if (rule.beach) pool = pool.filter((page) => (byId.get(page.id)?.tags || []).some((tag) => ["Beaches", "Beach resort", "Coast"].includes(tag)));
  if (rule.near) pool = pool.filter((page) => {
    const destination = byId.get(page.id);
    const distance = km(rule.near, destination?.latitude != null ? destination : GUIDE_CENTERS[page.id]);
    if (distance == null || distance > rule.near.maxKm) return false;
    why[page.id] = `About ${Math.round(distance)} km from ${rule.near.name} as the crow flies`;
    return true;
  });
  let fares = {};
  if (rule.fromWestCoast) {
    pool = pool.filter((page) => page.country !== "United States" && page.airport);
    for (const page of pool) {
      const best = WEST_COAST.map((origin) => observedFare(origin, page.airport)).filter(Boolean).sort((a, b) => a.median - b.median)[0];
      if (best) fares[page.id] = best;
    }
    pool = pool.filter((page) => fares[page.id]);
  }
  const ranked = pool.map((page) => {
    const destination = byId.get(page.id);
    const estimate = guideEstimate(destination, { nights, travelers: 1, startDate });
    const fare = fares[page.id];
    return { page, estimate, fare, total: estimate.low + (fare?.median || 0) };
  }).sort((a, b) => a.total - b.total).slice(0, 12);
  if (ranked.length < 4) return null;

  const items = ranked.map(({ page, estimate, fare }) => {
    const destination = byId.get(page.id);
    const temp = temperature(page.id, month);
    return {
      id: page.id,
      name: page.name,
      country: page.country,
      slug: page.slug,
      image: sizedPhoto(destination.image, 800),
      alt: page.alt,
      estimate: fmt(estimate.low, estimate.high),
      room: destination.planningAverages?.monthly?.[month - 1]?.hotelNight || null,
      knownFor: page.knownFor,
      note: why[page.id] || (temp != null && (rule.month || rule.warmWinter) ? `${temp} °C average in ${MONTHS[month - 1]}` : null),
      fare: fare ? `Round trips from ${fare.origin} seen at about ${formatMoney(fare.median)} for ${MONTHS[fare.month - 1]} (${fare.samples} fares, Aviasales)` : null,
      stay: topStay(page.id),
    };
  });
  const first = ranked[0];
  const scope = rule.month ? `in ${MONTHS[month - 1]}` : rule.warmWinter ? "for a warm winter trip" : rule.near ? `within driving range of ${rule.near.name}` : rule.fromWestCoast ? "from the West Coast" : "";
  const quick = [
    `${first.page.name}, ${first.page.country} comes out cheapest ${scope}: about ${fmt(first.estimate.low, first.estimate.high)} for ${nights} nights for one traveler${first.fare ? `, plus round-trip flights seen at about ${formatMoney(first.fare.median)}` : ", before flights"}.`,
    `${ranked[1].page.name} and ${ranked[2].page.name} follow. ${items.length} places are ranked from ${publishedDestinations.length} GlobTrek destination guides${rule.month ? `, counting only places that are 15–32 °C and fairly dry in ${MONTHS[month - 1]}` : ""}.`,
  ];
  const faqs = [
    [`How is this list ranked?`, `${rule.month ? `First by weather: only places averaging 15–32 °C with under about 4 mm of rain a day in ${MONTHS[month - 1]} (NASA POWER climate averages). Then b` : "B"}y GlobTrek's estimate for ${nights} nights for one traveler${rule.month || rule.warmWinter ? ` in ${MONTHS[month - 1]}` : ""}: lodging, food, activities and local transport${rule.fromWestCoast ? ", plus the cheapest round-trip fare seen from a West Coast airport" : ", before flights"}. Only places with at least 3 listed stays are included.`],
    [`What's the cheapest place on the list?`, `${first.page.name}, at about ${fmt(first.estimate.low, first.estimate.high)}${first.fare ? ` plus about ${formatMoney(first.fare.median)} in flights from ${first.fare.origin}` : ""}.`],
    [`Are these prices live?`, `No. They're planning estimates from GlobTrek's cost models${rule.fromWestCoast ? " and fares travelers found on Aviasales" : ""}. Booking.com shows the live price for each stay.`],
    [`Where should I stay in ${first.page.name}?`, items[0].stay ? `${items[0].stay.name} (${items[0].stay.type.toLowerCase()}) is the top budget pick in our data. The ${first.page.name} guide lists more.` : `See the ${first.page.name} guide for stays.`],
  ];
  return {
    ...guide,
    h1: guide.title,
    description: `${guide.title}, ranked by estimated cost: ${items.slice(0, 3).map((item) => item.name).join(", ")} and ${items.length - 3} more, with real stays and trip estimates.`,
    image: items[0].image.replace(/\/800px-/, "/1600px-"),
    imageAlt: items[0].alt,
    label: KIND_LABEL.list,
    chips: [`${items.length} places`, `${nights} nights`],
    facts: [
      ["Cheapest", first.page.name, `about ${fmt(first.estimate.low, first.estimate.high)}`],
      ["Ranked", `${items.length} places`, `${nights} nights, one traveler`],
      ["Runner-up", ranked[1].page.name, `about ${fmt(ranked[1].estimate.low, ranked[1].estimate.high)}`],
    ],
    quick,
    items,
    nights,
    faqs,
    related: relatedFor(guide),
    quizHref: "/discover",
  };
}

// ---- Versus ------------------------------------------------------------------

function versusGuide(guide) {
  const sides = guide.versus.map((id) => {
    const destination = byId.get(id);
    const page = pageById.get(id);
    if (!destination || !page) return null;
    const center = centerOf({}, destination);
    const stays = pickStays({}, destination, center, new Date().getUTCMonth() + 1);
    const weekend = guideEstimate(destination, { nights: 2, travelers: 2 });
    const week = guideEstimate(destination, { nights: 5, travelers: 1 });
    const may = destination.planningAverages?.monthly?.[4];
    const band = bandFor(destination);
    return {
      id, name: page.name, slug: page.slug, image: sizedPhoto(destination.image, 900), alt: page.alt, knownFor: page.knownFor,
      weekend: [weekend.low, weekend.high], week: [week.low, week.high],
      room: band?.budgetHotel || may?.hotelNight, dorm: band?.dormBed || null, food: may?.foodPerPersonDay, sky: weather(id),
      stays: stays.picks.slice(0, 2),
      activities: activitiesFor({ destinationId: id }, center).slice(0, 3),
      dinners: dinnersFor({ destinationId: id }, center).slice(0, 3),
    };
  });
  if (sides.some((side) => !side || side.stays.length < 2)) return null;
  const [a, b] = sides;
  const cheaper = a.week[0] <= b.week[0] ? a : b;
  const other = cheaper === a ? b : a;
  const gap = Math.round((1 - cheaper.week[0] / other.week[0]) * 100);
  const quick = [
    `${cheaper.name} is the cheaper of the two: about ${fmt(...cheaper.week)} for 5 nights for one traveler, against ${fmt(...other.week)} in ${other.name}${gap > 0 ? `, roughly ${gap}% less` : ""}.`,
    `A budget hotel room typically runs about ${formatMoney(a.room)} a night in ${a.name} and ${formatMoney(b.room)} in ${b.name}; food about ${formatMoney(a.food)} and ${formatMoney(b.food)} per person per day, so most of the gap is food.`,
    a.sky && b.sky ? `${a.name} is the warmer of the two: ${a.sky.warm.temp} °C against ${b.sky.warm.temp} °C in ${MONTHS[a.sky.warm.month - 1]}, and ${a.sky.cool.temp} °C against ${b.sky.cool.temp} °C in ${MONTHS[a.sky.cool.month - 1]}.` : null,
  ];
  const faqs = [
    [`Is ${a.name} or ${b.name} cheaper?`, quick[0]],
    [`How much is a weekend in each?`, `For two travelers, 2 nights: ${a.name} about ${fmt(...a.weekend)}, ${b.name} about ${fmt(...b.weekend)}, before getting there.`],
    [`Can I do both on one trip?`, `Yes. They're about 300 km apart on the same rail line, so many travelers split a week between them.`],
    [`Where should I stay in each?`, `${a.name}: ${a.stays.map((stay) => stay.name).join(" or ")}. ${b.name}: ${b.stays.map((stay) => stay.name).join(" or ")}. All are real Booking.com listings.`],
  ];
  return {
    ...guide,
    h1: guide.title,
    description: `${guide.title}: ${cheaper.name} costs about ${gap}% less for 5 nights. Rooms, food, best months, real stays and cheap dinners in both, side by side.`,
    image: a.image,
    imageAlt: a.alt,
    label: KIND_LABEL.versus,
    chips: [`${a.name} vs ${b.name}`],
    facts: [
      [`Weekend in ${a.name}`, fmt(...a.weekend), "2 travelers, before travel"],
      [`Weekend in ${b.name}`, fmt(...b.weekend), "2 travelers, before travel"],
      ["Cheaper", cheaper.name, `about ${gap}% less for 5 nights`],
    ],
    quick: quick.filter(Boolean), sides, faqs,
    related: relatedFor(guide),
    quizHref: "/discover",
  };
}

const cache = new Map();

// What a guide card shows: photo, labels and one line of numbers.
export function guideCard(built) {
  if (!built) return null;
  const meta = built.estimate ? `${fmt(built.estimate.low, built.estimate.high)} · ${people(built.estimate.travelers)}` : built.items ? `From ${built.items[0].name}, ${built.items[0].estimate}` : built.sides ? built.sides.map((side) => side.name).join(" or ") : null;
  return { slug: built.slug, title: built.title, image: built.image, imageAlt: built.imageAlt, chips: built.chips || [], label: built.label, place: built.country || built.label, meta };
}

export function buildGuide(guide) {
  if (!guide) return null;
  if (cache.has(guide.slug)) return cache.get(guide.slug);
  const built = guide.kind === "list" ? listGuide(guide) : guide.kind === "versus" ? versusGuide(guide) : placeGuide(guide);
  cache.set(guide.slug, built);
  return built;
}

// Guides that have enough real data to publish.
export function publishedGuides() {
  return GUIDES.map((guide) => buildGuide(guide)).filter(Boolean);
}

export { displayName };

// Guide cards for a catalog destination: its own guides and its towns' guides.
export function guidesFor(destinationId) {
  return GUIDES.filter((guide) => guide.destinationId === destinationId || pageById.get(guide.destinationId)?.parent === destinationId)
    .map((guide) => guideCard(buildGuide(guide))).filter(Boolean);
}
