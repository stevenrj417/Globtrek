// Booking.com stays for any place, from GlobTrek's CJ product feeds.
//
// What CJ gives (checked 2026-11-21): every property type, coordinates, star
// rating, photos, catalog flags and a CJ click link credited to GlobTrek. What it
// doesn't: prices (always 0.00), guest review scores, or any search by location
// or radius (keyword search only). So stays are found by searching the names of
// the towns near the destination, then kept only when their coordinates fall
// inside the search radius. Quality comes from matching each listing to its
// Google Maps place and using that place's rating (see picks.js).

import { cleanText, discoverFeeds, feedsForCountry } from "../catalog/cjBookingImporter.js";
import { distanceKm, normalizeText } from "./rank.js";

const CJ_HOSTS = ["kqzyfj.com", "dpbolvw.net", "anrdoezrs.net", "jdoqocy.com", "tkqlhce.com", "qksrv.net"];
const FIELDS = (pid) => `id title link imageLink categoryName starRating roomType amenities freeCancellation freeBreakfast freeInternet isDeleted joinedStatus
  address { city streetAddress provinceState country latitude longitude }
  linkCode(pid: "${pid}") { clickUrl }`;

// Property types by budget tier. Five-star places, resorts and villas never show.
const BUDGET_TYPES = new Set(["Hostel", "Capsule hotel", "Guest house", "Homestay", "Bed and breakfast", "Inn", "Motel", "Campsite", "Farm stay", "Lodge", "Country house", "Love hotel"]);
const MID_TYPES = new Set(["Hotel", "Aparthotel", "Apartment", "Holiday home", "Chalet", "Holiday park", "Boat", "Ryokan", "Tented camp"]);
const NEVER = new Set(["Villa", "Resort", "Luxury tent"]);

export function stayTier(category, stars) {
  const s = Number(stars) || 0;
  if (NEVER.has(category) || s >= 5) return null;
  if (s === 4) return "comfort";
  if (category === "Hostel" || category === "Capsule hotel") return "budget"; // dorms, whatever the stars
  if (BUDGET_TYPES.has(category)) return s >= 3 ? "mid" : "budget";
  if (category === "Hotel") return s && s <= 2 ? "budget" : "mid";
  if (MID_TYPES.has(category)) return "mid";
  return category ? "mid" : null;
}

// Stay themes, read only from the facilities each property lists on Booking.com.
// Plain rules, no AI. A place can have more than one theme, or none.
export const STAY_THEMES = {
  lively: { label: "Lively", intro: "Stays with a bar, live music, a club night or a social scene, going by the facilities they list on Booking.com." },
  calm: { label: "Quiet", intro: "Adults-only or soundproofed stays, or ones with a spa, sauna or garden, going by the facilities they list on Booking.com." },
  family: { label: "Family", intro: "Stays with things for kids, like a play area, kids' pool, kids' club or babysitting, going by the facilities they list on Booking.com." },
};
export const THEME_KEYS = Object.keys(STAY_THEMES);
const LIVELY = new Set(["nightclub", "dj", "karaoke", "pub crawls", "happy hour", "live music", "pool bar", "themed dinner nights", "movie nights", "live sport events (broadcast)"]);
const SOCIAL = new Set(["games room", "board games"]);
const CALM = new Set(["spa & wellness centre", "spa", "spa facilities", "spa lounge", "sauna", "hot tub", "massage", "yoga classes", "garden", "public bath"]);
const KIDS = new Set(["kids' club", "children's playground", "kids' pool", "babysitting", "child services", "kids' meals", "kid-friendly buffet", "baby safety gates", "kids' outdoor play equipment", "swimming pool toys"]);
const POOL = /\bpool\b/;

export function stayThemes(amenities, category) {
  const list = new Set(String(amenities || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
  const has = (set) => [...list].filter((item) => set.has(item)).length;
  const dorms = /hostel|capsule/i.test(category || "");
  const adultsOnly = list.has("adults only");
  const lively = has(LIVELY) > 0 || (list.has("bar") && (dorms || has(SOCIAL) > 0));
  const themes = [];
  if (lively) themes.push("lively");
  if (!lively && !dorms && (adultsOnly || list.has("soundproof rooms") || has(CALM) >= 2)) themes.push("calm");
  if (!adultsOnly && !dorms && (has(KIDS) > 0 || (list.has("family rooms") && [...list].some((item) => POOL.test(item))))) themes.push("family");
  return themes;
}

const yes = (value) => /^yes$/i.test(String(value || "").trim());
const num = (value) => (value === null || value === undefined || value === "" || !Number.isFinite(Number(value)) ? null : Number(value));

function httpsOn(value, hosts) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)) ? url : null;
  } catch { return null; }
}

// A feed row → a stay GlobTrek can show, or null when it isn't a real, bookable listing.
export function normalizeStay(row, center) {
  const name = cleanText(row?.title);
  const page = httpsOn(String(row?.link || "").split("?")[0], ["booking.com"]);
  const click = httpsOn(row?.linkCode?.clickUrl, CJ_HOSTS);
  if (!row?.id || !name || !page || !page.pathname.startsWith("/hotel/") || !click || row.isDeleted === true || row.joinedStatus === false) return null;
  const latitude = num(row.address?.latitude);
  const longitude = num(row.address?.longitude);
  if (latitude === null || longitude === null) return null;
  const category = cleanText(row.categoryName);
  const stars = num(row.starRating);
  const tier = stayTier(category, stars);
  if (!tier) return null;
  const photo = httpsOn(row.imageLink, ["bstatic.com"]);
  return {
    id: `bk:${row.id}`,
    propertyId: String(row.id),
    name,
    category,
    stars: stars ? Math.round(stars) : null,
    tier,
    themes: stayThemes(row.amenities, category),
    dorms: /shared|dorm|bunk|capsule|\bpod\b/i.test(row.roomType || ""),
    freeCancellation: yes(row.freeCancellation),
    freeBreakfast: yes(row.freeBreakfast),
    city: cleanText(row.address?.city),
    street: cleanText(row.address?.streetAddress),
    latitude,
    longitude,
    km: Math.round(distanceKm(center, { latitude, longitude }) * 100) / 100,
    photo: photo ? photo.toString() : null,
    bookingUrl: `${page.origin}${page.pathname}`,
    clickUrl: click.toString(),
  };
}

let feedCache = { at: 0, feeds: null };
async function feeds(client) {
  if (feedCache.feeds && Date.now() - feedCache.at < 6 * 3600 * 1000) return feedCache.feeds;
  feedCache = { at: Date.now(), feeds: await discoverFeeds(client) };
  return feedCache.feeds;
}

// Feeds to search for a country: its regional feed(s), or every feed when the
// country isn't mapped yet (rare; slower).
export async function feedsFor(client, countryName) {
  const all = await feeds(client);
  const mapped = feedsForCountry(all, countryName);
  return mapped.length ? mapped : all;
}

// Searches the feed(s) for each town name and returns listings within radiusKm.
// `seen` carries results between widening steps so a name is searched once.
export async function searchStays(client, { feeds: feedList, names, center, radiusKm, seen = new Map(), searched = new Set(), maxQueries = 6 }) {
  let queries = 0;
  for (const name of names) {
    const key = normalizeText(name);
    if (!key || searched.has(key)) continue;
    if (queries >= maxQueries) break;
    searched.add(key);
    for (const feed of feedList) {
      queries += 1;
      const data = await client.query(`{ travelExperienceProducts(companyId: "${client.credentials.companyId}", adIds: ["${feed.adId}"], keywords: ${JSON.stringify(name)}, limit: 500) { resultList { ${FIELDS(client.credentials.pid)} } } }`);
      const rows = data?.travelExperienceProducts?.resultList || [];
      for (const row of rows) {
        const stay = normalizeStay(row, center);
        if (stay && !seen.has(stay.id)) seen.set(stay.id, stay);
      }
      if (rows.length) break; // found in this region's feed; skip the others
    }
  }
  return { stays: [...seen.values()].filter((stay) => stay.km !== null && stay.km <= radiusKm), seen, searched };
}
