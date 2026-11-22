import { readFile } from "node:fs/promises";
import { join } from "node:path";
import index from "../../data/stayIndex.json" with { type: "json" };
import { stayTier } from "../anyplace/stays.js";
import { countryName } from "./country.js";

// Hotel search and lookup over GlobTrek's Booking.com catalog (from the CJ feeds).
// Search uses the small name index; a hotel's own page reads the full feed record.

const fold = (value) => String(value || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export { countryName };

let rows;
function searchRows() {
  rows ||= index.stays.map(([id, name, city, country, stars, category]) => ({ id, name, city, country, stars, category, key: fold(name), where: fold(`${city} ${countryName(country)}`) }));
  return rows;
}

// Hotels whose name holds every word typed (a city or country word may match the
// place instead), best first: name starts with the query, then whole-word matches.
export function searchStays(query, limit = 6) {
  const words = fold(query).split(" ").filter(Boolean);
  if (!words.length || fold(query).length < 3) return [];
  const phrase = words.join(" ");
  const found = [];
  for (const row of searchRows()) {
    let inName = 0;
    let ok = true;
    for (const word of words) {
      if (row.key.includes(word)) inName += 1;
      else if (!row.where.includes(word)) { ok = false; break; }
    }
    if (!ok || !inName) continue;
    const score = (row.key.startsWith(phrase) ? 4 : row.key.includes(phrase) ? 2 : 0) + inName + (` ${row.key} `.includes(` ${words[0]} `) ? 1 : 0);
    found.push({ row, score });
  }
  found.sort((a, b) => b.score - a.score || a.row.name.length - b.row.name.length || a.row.name.localeCompare(b.row.name));
  return found.slice(0, limit).map(({ row }) => ({ id: row.id, name: row.name, city: row.city, country: countryName(row.country), stars: row.stars || null, category: row.category || null }));
}

let feedPromise;
function feed() {
  feedPromise ||= readFile(join(process.cwd(), "app/data/feedStays.json"), "utf8").then((text) => {
    const byId = new Map();
    for (const list of Object.values(JSON.parse(text).stays)) for (const stay of list) if (!byId.has(String(stay.providerPropertyId))) byId.set(String(stay.providerPropertyId), stay);
    return byId;
  });
  return feedPromise;
}

export const isStayId = (value) => /^\d{1,12}$/.test(String(value || ""));

// The full catalog record for one hotel, shaped for its page, or null.
export async function stayById(id) {
  if (!isStayId(id)) return null;
  const stay = (await feed()).get(String(id));
  if (!stay) return null;
  const stars = stay.starRating ? Math.round(stay.starRating) : null;
  return {
    id: String(stay.providerPropertyId),
    name: stay.name,
    category: stay.category || null,
    stars,
    tier: stayTier(stay.category, stars),
    description: stay.description || null,
    street: stay.streetAddress || null,
    city: stay.city || null,
    region: stay.provinceState || null,
    country: countryName(stay.country),
    countryCode: stay.country || null,
    latitude: Number.isFinite(stay.latitude) ? stay.latitude : null,
    longitude: Number.isFinite(stay.longitude) ? stay.longitude : null,
    photos: (stay.photos || []).filter((url) => /^https:\/\/[a-z0-9-]+\.bstatic\.com\//.test(url)).slice(0, 6),
    amenities: Array.isArray(stay.amenities) ? stay.amenities : [],
    roomTypes: Array.isArray(stay.roomTypes) ? stay.roomTypes.slice(0, 8) : [],
    dorms: Boolean(stay.dorms),
    bedrooms: stay.bedrooms || null,
    maxGuests: stay.maxGuests || null,
    freeCancellation: Boolean(stay.catalogFreeCancellation),
    freeBreakfast: Boolean(stay.catalogFreeBreakfast),
    bookingUrl: stay.bookingUrl,
    clickUrl: stay.cjClickUrl,
    destinationId: stay.destinationId || null,
  };
}

// The same hotel in the shape the trip planner uses for its picks (stays.js).
export function asPickStay(stay, center, distanceKm) {
  if (!stay?.bookingUrl || !stay.clickUrl || stay.latitude == null) return null;
  const km = center ? distanceKm(center, { latitude: stay.latitude, longitude: stay.longitude }) : null;
  return {
    id: `bk:${stay.id}`, propertyId: stay.id, name: stay.name, category: stay.category, stars: stay.stars, tier: stay.tier, themes: [],
    bedrooms: stay.bedrooms, sleeps: stay.maxGuests, dorms: stay.dorms, freeCancellation: stay.freeCancellation, freeBreakfast: stay.freeBreakfast,
    city: stay.city, street: stay.street, latitude: stay.latitude, longitude: stay.longitude,
    km: km == null ? null : Math.round(km * 100) / 100, photo: stay.photos[0] || null, bookingUrl: stay.bookingUrl.split("?")[0], clickUrl: stay.clickUrl,
  };
}
