// Top 3 stays, dinners and things to do for any place in the world, chosen by
// code (no AI). Same place + same budget → same picks: the ranking is
// deterministic (ties break by ID) and the chosen IDs are saved for 21 days.
//
// Search widens step by step for small places: the town itself, then 10, 25 and
// 50 km, loosening the review minimum at each step. A section is never empty: if
// nothing passes the quality bar, the best of what exists is shown, labeled.

import { nameSimilarity } from "../google-places/GooglePlacesHotelProvider.js";
import { BUDGETS, BUDGET_KEYS, MIN_RATING, byScore, distanceKm, distancePenalty, normalizeText, pickVaried, round, streetKey, weightedRating } from "./rank.js";
import { LODGING_FIELDS } from "./google.js";
import { feedsFor, searchStays } from "./stays.js";

export const PICKS_VERSION = 1;
export const REFRESH_DAYS = 21;
const COUNT = 3;

export const STEP_RADII_KM = [null, 10, 25, 50]; // null = the town's own size
const MIN_REVIEWS = { dinners: [30, 15, 5, 1], activities: [30, 15, 5, 1], stays: [20, 10, 5, 1] };

const LODGING_TYPES = [["hostel", "guest_house", "bed_and_breakfast", "inn", "motel", "farmstay", "cottage", "private_guest_room"], ["hotel", "lodging"]];
// A dinner is a place whose main business is food (a campground with a restaurant isn't).
const DINNER_PRIMARY = /restaurant|steak_house|bistro|diner|brasserie|gastropub|pub$|tavern|pizzeria|churrascaria|izakaya|trattoria|osteria|taverna|food$/;
export const isDinner = (place) => place.types?.includes("restaurant") && !NOT_DINNER.has(place.primaryType) && (!place.primaryType || DINNER_PRIMARY.test(place.primaryType));
const NOT_DINNER = new Set(["fast_food_restaurant", "cafe", "coffee_shop", "bakery", "ice_cream_shop", "dessert_shop", "dessert_restaurant", "confectionery", "juice_shop", "donut_shop", "bar", "night_club", "wine_bar", "cafeteria", "food_court", "snack_bar", "tea_house", "chocolate_shop"]);
const SIGHT_TYPES = ["tourist_attraction", "museum", "art_gallery", "historical_landmark", "cultural_landmark", "monument", "church", "zoo", "aquarium", "amusement_park", "botanical_garden", "market", "plaza", "visitor_center"];
const NATURE_TYPES = ["park", "national_park", "state_park", "hiking_area", "beach", "observation_deck", "wildlife_park", "wildlife_refuge"];
const NATURE = new Set([...NATURE_TYPES, "natural_feature", "botanical_garden", "garden", "lake", "waterfall", "mountain_peak", "nature_preserve"]);
const NOT_ACTIVITY = /restaurant|hotel|lodging|hostel|store|shop|agency|rental|parking|gas_station|bank|atm|school|hospital|doctor|dentist|pharmacy|office|apartment|real_estate|car_|transit|bus_station|train_station|airport|gym|spa|bar$|cafe/;

const CUISINE_WORDS = ["pizza", "sushi", "burger", "taco", "ramen", "steak", "churrasc", "kebab", "curry", "bbq", "barbecue", "seafood", "marisq", "vegan", "noodle", "dumpling", "tapas", "pasta", "trattoria", "pizzeria", "chinese", "thai", "indian", "mexican", "japanese", "korean", "italian"];

function placeName(place) { return place?.displayName?.text?.trim() || ""; }
function operational(place) { return !place.businessStatus || place.businessStatus === "OPERATIONAL"; }

export function cuisineKey(place) {
  if (place.primaryType && place.primaryType !== "restaurant") return place.primaryType.replace(/_restaurant$/, "");
  const name = normalizeText(placeName(place));
  const word = CUISINE_WORDS.find((item) => name.includes(item));
  return word ? word.replace(/pizzeria/, "pizza").replace(/trattoria|pasta/, "italian").replace(/churrasc|barbecue/, "bbq").replace(/marisq/, "seafood") : null;
}

export function activityGroup(place) {
  const types = new Set([place.primaryType, ...(place.types || [])].filter(Boolean));
  // By the main type, or a strong outdoor tag (a town square tagged "park" stays a landmark).
  if (NATURE.has(place.primaryType) || ["natural_feature", "hiking_area", "national_park", "state_park", "beach"].some((type) => types.has(type))) return "nature";
  if (types.has("museum") || types.has("art_gallery")) return "museum";
  if (types.has("market")) return "market";
  if (types.has("zoo") || types.has("aquarium") || types.has("amusement_park")) return "family";
  if (["historical_landmark", "cultural_landmark", "monument", "church", "plaza", "historical_place"].some((type) => types.has(type))) return "landmark";
  return "sight";
}

// A Google search result → a ranked candidate (or null when it can't be ranked).
function candidate(place, center) {
  if (!place?.id || !placeName(place) || !operational(place)) return null;
  const km = distanceKm(center, place.location);
  const weighted = weightedRating(place.rating, place.userRatingCount);
  return { id: place.id, name: placeName(place), rating: Number(place.rating) || null, reviews: Number(place.userRatingCount) || 0, priceLevel: place.priceLevel || null, primaryType: place.primaryType || null, types: place.types || [], location: place.location || null, km: km === null ? null : round(km), weighted, score: weighted === null ? -1 : round(weighted - distancePenalty(km)) };
}

const passes = (item, minReviews) => item.rating !== null && item.rating >= MIN_RATING && item.reviews >= minReviews;

function rankWithin(pool, radiusKm, minReviews, allowed) {
  return [...pool.values()].filter((item) => item.km !== null && item.km <= radiusKm && allowed(item) && passes(item, minReviews)).sort(byScore);
}

// The best that exists when nothing passes the bar, so a section is never empty.
function bestAvailable(pool, allowed) {
  return [...pool.values()].filter((item) => allowed(item)).sort((a, b) => (b.weighted ?? 0) - (a.weighted ?? 0) || (a.km ?? 99) - (b.km ?? 99) || String(a.id).localeCompare(String(b.id)));
}

const near = (a, b, km) => { const d = distanceKm(a.location || a, b.location || b); return d !== null && d < km; };
// At most two of one cuisine (two Brazilian places in Brazil are fine; three pizzerias aren't).
const dinnerClash = (a, b, chosen = []) => near(a, b, 0.08) || (Boolean(cuisineKey(a)) && chosen.filter((other) => cuisineKey(other) === cuisineKey(a)).length >= 2);
export const dinnerClashForTest = dinnerClash;
const activityClash = (a, b) => (activityGroup(a) === activityGroup(b) && activityGroup(a) !== "sight") || near(a, b, 0.15);
const stayClash = (a, b) => a.category === b.category || near(a, b, 0.2) || (streetKey(a.street) && streetKey(a.street) === streetKey(b.street));

// At least one outdoor pick when a good one exists, so small towns get their hikes and viewpoints.
function withNature(picks, ranked) {
  if (picks.some((item) => activityGroup(item) === "nature")) return picks;
  const nature = ranked.find((item) => activityGroup(item) === "nature" && !picks.includes(item));
  if (!nature) return picks;
  const ordered = [...picks].sort(byScore);
  // Replace a repeat (a second church, say) before anything else, else the lowest-ranked pick.
  const repeat = ordered.findIndex((item, index) => ordered.slice(0, index).some((other) => activityClash(item, other)));
  const drop = ordered.length < COUNT ? -1 : repeat >= 0 ? repeat : ordered.length - 1;
  return [...ordered.filter((_, index) => index !== drop), nature].sort(byScore);
}

function label(kind, picks, townKm) {
  if (!picks.length) return null;
  const nearest = Math.min(...picks.map((item) => item.km ?? 0));
  if (nearest <= townKm + 1) return null;
  const noun = { stays: "stays", dinners: "places to eat", activities: "things to do" }[kind];
  return `Nearest ${noun} — ${Math.round(nearest)} km away`;
}

// How big the place is: half its viewport's diagonal, kept between 2 and 8 km.
export function townRadiusKm(viewport) {
  const half = distanceKm(viewport?.low, viewport?.high);
  return half === null ? 4 : Math.min(8, Math.max(2, half / 2));
}

export function destinationFrom(details) {
  if (!details?.id || !details.location) return null;
  const parts = details.addressComponents || [];
  const part = (type) => parts.find((item) => item.types?.includes(type));
  return {
    placeId: details.id,
    name: placeName(details),
    country: part("country")?.longText || null,
    countryCode: part("country")?.shortText || null,
    region: part("administrative_area_level_1")?.longText || null,
    nearbyNames: [...new Set([placeName(details), part("locality")?.longText, part("postal_town")?.longText, part("administrative_area_level_3")?.longText, part("administrative_area_level_2")?.longText].filter(Boolean))],
    center: { latitude: details.location.latitude, longitude: details.location.longitude },
    townKm: round(townRadiusKm(details.viewport)),
  };
}

// Town names from Google lodging results, to search CJ by name near the place.
function lodgingTowns(places) {
  const names = [];
  for (const place of places) for (const part of place.addressComponents || []) {
    if (part.types?.some((type) => ["locality", "postal_town", "administrative_area_level_3", "sublocality"].includes(type)) && part.longText) names.push(part.longText);
  }
  const counts = new Map();
  for (const name of names) counts.set(name, (counts.get(name) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name);
}

// Match a Booking.com listing to the Google Maps place for the same property.
export function matchStay(stay, lodging) {
  let best = null;
  for (const place of lodging) {
    const km = distanceKm(stay, place.location);
    if (km === null || km > 0.3) continue;
    const similarity = nameSimilarity(stay.name, placeName(place));
    if (similarity >= 0.6 || (similarity >= 0.45 && km <= 0.08)) {
      if (!best || similarity > best.similarity || (similarity === best.similarity && place.id < best.place.id)) best = { place, similarity };
    }
  }
  return best?.place || null;
}

function stayScore(stay, budget) {
  const tierBonus = stay.tier === BUDGETS[budget].stayTiers[0] ? 0.1 : 0;
  const flags = (stay.freeCancellation ? 0.02 : 0) + (stay.freeBreakfast ? 0.01 : 0);
  if (stay.weighted === null) return round(3.85 - distancePenalty(stay.km) + tierBonus + flags);
  return round(stay.weighted - distancePenalty(stay.km) + tierBonus + flags);
}

// Searches Google and CJ step by step and returns picks for every budget.
// debug (test route only): receives the top-ranked candidates per kind and budget.
export async function computePicks({ places, cj, destination, log = () => {}, debug = null }) {
  const { center, townKm } = destination;
  const radii = STEP_RADII_KM.map((km) => km ?? townKm);
  const pools = { dinners: new Map(), activities: new Map(), lodging: new Map() };
  const searchedRadius = { dinners: 0, activities: 0, lodging: 0 };
  let staySearch = { seen: new Map(), searched: new Set() };
  const cjFeeds = destination.country ? await feedsFor(cj, destination.country).catch(() => []) : [];

  const add = (pool, results) => { for (const place of results) { const item = candidate(place, center); if (item && !pool.has(item.id)) pool.set(item.id, item); } };
  const safe = async (label, promise) => { try { return await promise; } catch (error) { log({ msg: "anyplace_search_failed", search: label, error: error.message }); return []; } };

  async function widenDinners(radiusKm, first) {
    if (searchedRadius.dinners >= radiusKm) return;
    searchedRadius.dinners = radiusKm;
    const radiusM = radiusKm * 1000;
    const searches = [safe("dinners", places.nearby({ center, radiusM, includedTypes: ["restaurant"] }))];
    if (first) {
      searches.push(safe("dinners_cheap", places.text({ textQuery: `restaurants in ${destination.name}`, includedType: "restaurant", priceLevels: ["PRICE_LEVEL_INEXPENSIVE"], center, radiusM })));
      searches.push(safe("dinners_mid", places.text({ textQuery: `restaurants in ${destination.name}`, includedType: "restaurant", priceLevels: ["PRICE_LEVEL_MODERATE", "PRICE_LEVEL_EXPENSIVE"], center, radiusM })));
    }
    for (const results of await Promise.all(searches)) add(pools.dinners, results.filter(isDinner));
  }

  async function widenActivities(radiusKm, first) {
    if (searchedRadius.activities >= radiusKm) return;
    searchedRadius.activities = radiusKm;
    const radiusM = radiusKm * 1000;
    const searches = [safe("sights", places.nearby({ center, radiusM, includedTypes: SIGHT_TYPES })), safe("nature", places.nearby({ center, radiusM, includedTypes: NATURE_TYPES }))];
    if (first) searches.push(safe("outdoors", places.text({ textQuery: `waterfalls, viewpoints and hiking trails near ${destination.name}`, center, radiusM: Math.max(radiusM, 30000) })));
    for (const results of await Promise.all(searches)) add(pools.activities, results.filter((place) => !NOT_ACTIVITY.test(place.primaryType || "")));
  }

  async function widenStays(radiusKm, first) {
    if (searchedRadius.lodging < radiusKm) {
      searchedRadius.lodging = radiusKm;
      const results = await Promise.all(LODGING_TYPES.map((includedTypes) => safe("lodging", places.nearby({ center, radiusM: radiusKm * 1000, includedTypes, fieldMask: LODGING_FIELDS }))));
      for (const place of results.flat()) if (place?.id && !pools.lodging.has(place.id)) pools.lodging.set(place.id, place);
    }
    const names = first ? [destination.name, `${destination.name} hostel`, `${destination.name} guest house`, ...destination.nearbyNames] : lodgingTowns([...pools.lodging.values()]);
    if (cjFeeds.length) {
      try { staySearch = await searchStays(cj, { feeds: cjFeeds, names, center, radiusKm, seen: staySearch.seen, searched: staySearch.searched, maxQueries: first ? 6 : 3 }); }
      catch (error) { log({ msg: "anyplace_cj_failed", error: error.message }); }
    }
    const lodging = [...pools.lodging.values()];
    return [...staySearch.seen.values()].filter((stay) => stay.km <= radiusKm).map((stay) => {
      const place = matchStay(stay, lodging);
      return { ...stay, googlePlaceId: place?.id || null, rating: Number(place?.rating) || null, reviews: Number(place?.userRatingCount) || 0, weighted: place ? weightedRating(place.rating, place.userRatingCount) : null };
    });
  }

  const result = Object.fromEntries(BUDGET_KEYS.map((key) => [key, { v: PICKS_VERSION, computedAt: new Date().toISOString(), townKm, stays: [], dinners: [], activities: [], labels: {}, steps: {} }]));

  // Dinners and things to do: same pool for every budget, filtered by price.
  for (const kind of ["dinners", "activities"]) {
    const widen = kind === "dinners" ? widenDinners : widenActivities;
    const clash = kind === "dinners" ? dinnerClash : activityClash;
    for (const key of BUDGET_KEYS) {
      const prices = BUDGETS[key][kind === "dinners" ? "dinnerPrices" : "activityPrices"];
      const allowed = (item) => prices.includes(item.priceLevel);
      let picks = [];
      let step = 0;
      for (; step < radii.length; step += 1) {
        await widen(radii[step], step === 0);
        const ranked = rankWithin(pools[kind], radii[step], MIN_REVIEWS[kind][step], allowed);
        picks = pickVaried(ranked, COUNT, clash);
        debug?.({ kind, budget: key, step, ranked: ranked.slice(0, 8).map((item) => ({ name: item.name, type: item.primaryType, group: kind === "activities" ? activityGroup(item) : cuisineKey(item), rating: item.rating, reviews: item.reviews, km: item.km, score: item.score })) });
        // Outdoors within 25 km counts even while the rest stays in town.
        if (kind === "activities") picks = withNature(picks, rankWithin(pools[kind], Math.max(radii[step], 25), MIN_REVIEWS[kind][step], allowed));
        if (picks.length >= COUNT) break;
      }
      step = Math.min(step, radii.length - 1);
      if (picks.length < COUNT) {
        const fill = bestAvailable(pools[kind], allowed).filter((item) => !picks.some((pick) => pick.id === item.id));
        picks = [...picks, ...fill.slice(0, COUNT - picks.length).map((item) => ({ ...item, belowBar: true }))];
      }
      result[key][kind] = picks.map((item) => ({ id: item.id, km: item.km, ...(item.belowBar ? { belowBar: true } : {}) }));
      result[key].labels[kind] = label(kind, picks, townKm);
      result[key].steps[kind] = step;
    }
  }

  // Stays: real Booking.com listings, ranked by the Google rating of the same property.
  for (const key of BUDGET_KEYS) {
    const tiers = BUDGETS[key].stayTiers;
    let picks = [];
    let step = 0;
    let candidates = [];
    for (; step < radii.length; step += 1) {
      candidates = (await widenStays(radii[step], step === 0)).filter((stay) => tiers.includes(stay.tier)).map((stay) => ({ ...stay, score: stayScore(stay, key) }));
      const ranked = candidates.filter((stay) => stay.rating !== null && stay.rating >= MIN_RATING && stay.reviews >= MIN_REVIEWS.stays[step]).sort(byScore);
      picks = pickVaried(ranked, COUNT, stayClash);
      if (picks.length >= COUNT) break;
    }
    step = Math.min(step, radii.length - 1);
    if (picks.length < COUNT) {
      // Listings without Google reviews, closest and best-matched to the budget first.
      const unrated = candidates.filter((stay) => stay.rating === null && !picks.some((pick) => pick.id === stay.id)).sort(byScore);
      picks = [...picks, ...pickVaried(unrated, COUNT - picks.length, stayClash).map((stay) => ({ ...stay, unrated: true }))];
    }
    result[key].stays = picks.map(({ score, weighted, rating, reviews, ...stay }) => stay);
    result[key].labels.stays = label("stays", picks, townKm);
    result[key].steps.stays = step;
  }

  log({ msg: "anyplace_computed", place: destination.placeId, googleCalls: places.stats?.().calls, cjCalls: cj.stats?.().requests });
  return result;
}
