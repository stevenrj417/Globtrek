// A hotel's price level ($ to $$$$) and the typical nightly price for that
// kind of stay in its destination. Never the hotel's own rate: the CJ feed has
// no prices, so this reads the hotel's class (stars, hostel, villa) against the
// destination's planning prices:
//   1. the master list's lodging band (lodgingPriceBands.json), or
//   2. the destination's yearly good-value room and business-standard hotel
//      (planningAverages: modeled local prices and government per diem rates).
// Resort islands, whose bands sit far below what their resorts charge, get a
// level but no dollar figure.
import { destinations } from "../../data/destinations.js";
import { priceBand, RESORT_ECONOMIES } from "../../data/destinationPlanningAverages.js";
import { stayTier } from "../anyplace/stays.js";

const byId = new Map(destinations.map((destination) => [destination.id, destination]));
const LEVEL = { budget: "$", mid: "$$", comfort: "$$$", luxury: "$$$$" };
export const LEVEL_WORDS = { $: "Budget", $$: "Mid-range", $$$: "Upscale", $$$$: "Luxury" };
// Ratios between classes in the master list's bands (the same in every band).
const RATIO = { dorm: 0.39, budget: 1, mid: 1.46, comfort: 2.1, luxury: 4 };
// Whole places, priced by bedrooms. Hotels and guest houses list their room
// count as "bedrooms" in the feed, so only these categories count.
const WHOLE_HOMES = new Set(["Apartment", "Holiday home", "Villa", "Chalet"]);
const KIND = { dorm: "a dorm bed", budget: "a budget room", mid: "a 3-star room", comfort: "a 4-star room", luxury: "a luxury room" };

const average = (values) => {
  const list = values.filter((value) => Number(value) > 0);
  return list.length ? list.reduce((sum, value) => sum + Number(value), 0) / list.length : null;
};
const roundTo5 = (value) => Math.max(5, Math.round(value / 5) * 5);

function typicalNight(destination, klass) {
  if (!destination || RESORT_ECONOMIES.has(destination.id)) return null;
  const band = priceBand(destination);
  if (band) {
    const value = { dorm: band.dormBed, budget: band.budgetHotel, mid: band.threeStar, comfort: band.fourStar, luxury: band.luxury }[klass];
    if (value > 0) return { value: roundTo5(value), source: "band" };
  }
  const monthly = destination.planningAverages?.monthly || [];
  const room = average(monthly.map((month) => month.hotelNight));
  const standard = average(monthly.map((month) => month.standardHotelNight));
  // The per diem "standard" hotel is a business 4-star; a 3-star sits between.
  if (klass === "comfort" && standard) return { value: roundTo5(standard), source: "planning" };
  if (klass === "luxury" && standard) return { value: roundTo5(standard * (RATIO.luxury / RATIO.comfort)), source: "planning" };
  return room ? { value: roundTo5(room * RATIO[klass]), source: "planning" } : null;
}

// stay: a feed record or a stayById() result (category, stars/starRating,
// dorms, bedrooms, destinationId). Returns null when the class is unknown.
export function hotelPriceLevel(stay) {
  if (!stay) return null;
  const stars = Number(stay.stars ?? stay.starRating) || 0;
  // Only the catalog's own tiers; the shortlist groups stays as "upscale" too.
  const tier = LEVEL[stay.tier] ? stay.tier : stayTier(stay.category, stars ? Math.round(stars) : null);
  if (!tier) return null;
  const dorm = Boolean(stay.dorms) || stay.category === "Hostel" || stay.category === "Capsule hotel";
  const klass = dorm ? "dorm" : tier;
  const level = LEVEL[tier];
  const destination = byId.get(stay.destinationId);
  const night = typicalNight(destination, klass);
  // A whole home is priced by bedrooms, like the trip planner does.
  const rooms = !dorm && Number(stay.bedrooms) > 1 && WHOLE_HOMES.has(stay.category) ? Math.min(6, Number(stay.bedrooms)) : 1;
  const city = destination?.city ? String(destination.city).replace(/\b\p{L}/gu, (letter) => letter.toUpperCase()).replace(/\B\p{Lu}+/gu, (rest) => rest.toLowerCase()) : null;
  return {
    level,
    words: LEVEL_WORDS[level],
    typical: night ? night.value * rooms : null,
    unit: dorm ? "bed" : rooms > 1 ? `${rooms}-bedroom place` : "room",
    label: night ? `About $${(night.value * rooms).toLocaleString("en-US")} a night` : null,
    basis: night ? `Typical for ${rooms > 1 ? `${rooms} rooms at ${KIND[klass].replace(/^a /, "")} price` : KIND[klass]}${city ? ` in ${city}` : ""}, not this hotel's own rate. Check Booking.com for your dates.` : "Check Booking.com for prices on your dates.",
  };
}
