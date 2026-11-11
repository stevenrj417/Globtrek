// Imports Booking.com property listings from GlobTrek's CJ product feeds.
//
// What the feeds are: Booking.com's static property catalog (names, photos, room
// and bed descriptions, amenities, address, coordinates, catalog flags such as
// "free cancellation available") with a CJ click link credited to GlobTrek,
// refreshed by Booking.com about once a day. What they are not: live prices,
// date-specific availability, rate plans, taxes or guest reviews. Prices in the
// feed are always 0.00, so the importer never reads them.
//
// Flow per destination: find the right regional feed, search it with light
// fields to shortlist up to SHORTLIST properties in the destination, fetch full
// records for that shortlist, normalize, then hand them to a store (Supabase, a
// JSON snapshot, or nothing in a dry run). One destination failing never stops
// the rest; the run reports which ones failed and why, without secrets.

import { nearDestination } from "./nearDestination.js";

export const BOOKING_ADVERTISER_ID = "7864295";
export const SHORTLIST = 60;
const PAGE = 1000;
const MAX_PAGES = 3;
const CHUNK = 50;

// Feed names Booking.com uses on CJ, by destination country. Feeds are found by
// name at run time, so a changed ad ID is picked up automatically.
const REGION_BY_COUNTRY = {
  "UNITED STATES": ["Feed: US"],
  CANADA: ["Feed: Canada, Mexico"],
  MEXICO: ["Feed: Canada, Mexico"],
  "COSTA RICA": ["Feed: Caribbean, Central America"],
  BRAZIL: ["Feed: South America"],
  ARGENTINA: ["Feed: South America"],
  "ARGENTINA & CHILE": ["Feed: South America"],
  "UNITED KINGDOM": ["Feed: UK, Ireland"],
  FRANCE: ["Feed: Western Europe"],
  ITALY: ["Feed: Western Europe"],
  PORTUGAL: ["Feed: Western Europe"],
  SPAIN: ["Feed: Western Europe"],
  GREECE: ["Feed: Western Europe", "Feed: Northern and Eastern Europe"],
  ICELAND: ["Feed: Northern and Eastern Europe", "Feed: Western Europe"],
  JAPAN: ["Feed: East Asia, Oceania"],
  "SOUTH KOREA": ["Feed: East Asia, Oceania"],
  AUSTRALIA: ["Feed: East Asia, Oceania"],
  "NEW ZEALAND": ["Feed: East Asia, Oceania"],
  "FRENCH POLYNESIA": ["Feed: East Asia, Oceania"],
  THAILAND: ["Feed: South and Southeast Asia"],
  VIETNAM: ["Feed: South and Southeast Asia"],
  INDONESIA: ["Feed: South and Southeast Asia"],
  SINGAPORE: ["Feed: South and Southeast Asia"],
  MALDIVES: ["Feed: South and Southeast Asia"],
  "UNITED ARAB EMIRATES": ["Feed: Middle East, Africa"],
  "SOUTH AFRICA": ["Feed: Middle East, Africa"],
  MOROCCO: ["Feed: Middle East, Africa"],
  KENYA: ["Feed: Middle East, Africa"],
  AUSTRIA: ["Feed: Western Europe", "Feed: Northern and Eastern Europe"],
  SWITZERLAND: ["Feed: Western Europe", "Feed: Northern and Eastern Europe"],
  POLAND: ["Feed: Northern and Eastern Europe", "Feed: Western Europe"],
  ROMANIA: ["Feed: Northern and Eastern Europe", "Feed: Western Europe"],
  SLOVENIA: ["Feed: Northern and Eastern Europe", "Feed: Western Europe"],
  GEORGIA: ["Feed: Northern and Eastern Europe", "Feed: Middle East, Africa"],
  NEPAL: ["Feed: South and Southeast Asia"],
};

// Stay types GlobTrek recommends, with a budget weight. Resorts, villas, whole
// homes, apartments, room shares and campsites are left out.
const CATEGORY_WEIGHT = { Hostel: 6, "Capsule hotel": 6, "Guest house": 3.5, Motel: 3.5, Inn: 2.5, "Bed and breakfast": 2.5, Hotel: 1.5, Lodge: 1.5 };
const MAX_STARS = 4;
const DORM = /shared|dorm|bunk|capsule|\bpod\b/i;
// Listing-style names (a room description or an event, not a property name).
export const GENERIC_NAME = /^(private|quiet|cozy|cosy|clean|room|bed|shared|charming|change of)\b|\bminutes? (to|from)\b|\b(new years?|new year's|christmas|holiday special|getaway|vacation rental)\b/i;

const LIGHT = "id link categoryName starRating address { city latitude longitude }";
export const FULL_FIELDS = (pid) => `id adId title description link imageLink additionalImageLink categoryName starRating roomType beds bedrooms baths bedsDescription includedGuestsCount
  amenities accessibility diningOptions freeCancellation freeInternet freeBreakfast proximityAirport lastUpdated isDeleted joinedStatus
  address { city streetAddress zipCode provinceState country latitude longitude }
  linkCode(pid: "${pid}") { clickUrl }`;

// The feed stores some UTF-8 text decoded as Latin-1 ("MÃ©rida"); undo that.
export function cleanText(value) {
  if (typeof value !== "string") return value ?? null;
  const fixed = /Ã|Â|â€/.test(value) ? Buffer.from(value, "latin1").toString("utf8") : value;
  return fixed.replace(/\s+/g, " ").trim() || null;
}
const yes = (value) => (value == null || value === "" ? null : /^yes$/i.test(String(value).trim()));
const list = (value) => [...new Set(String(cleanText(value) || "").split(/\s*,\s*/).filter(Boolean))];
export const normalizeName = (value) => String(cleanText(value) || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const titleCase = (value) => String(value || "").toLowerCase().replace(/(^|[\s-])\S/g, (letter) => letter.toUpperCase());
const number = (value) => (value === null || value === undefined || value === "" || !Number.isFinite(Number(value)) ? null : Number(value));

function httpsUrl(value, hosts) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)) ? url : null;
  } catch {
    return null;
  }
}
const CJ_HOSTS = ["kqzyfj.com", "dpbolvw.net", "anrdoezrs.net", "jdoqocy.com", "tkqlhce.com", "qksrv.net"];

export function feedsForCountry(feeds, country) {
  const names = REGION_BY_COUNTRY[String(country || "").toUpperCase()] || [];
  return names.map((name) => feeds.find((feed) => feed.name === name)).filter(Boolean);
}

export async function discoverFeeds(client) {
  const data = await client.query(`{ productFeeds(companyId: "${client.credentials.companyId}", partnerIds: ["${BOOKING_ADVERTISER_ID}"]) { resultList { adId feedName productCount lastUpdated sourceFeedType } } }`);
  return (data?.productFeeds?.resultList || [])
    .filter((feed) => feed.sourceFeedType === "TRAVEL" && /^Feed: /.test(feed.feedName || "") && Number(feed.productCount) > 0)
    .map((feed) => ({ adId: String(feed.adId), name: feed.feedName, productCount: Number(feed.productCount), lastUpdated: feed.lastUpdated || null }));
}

// City names the feed may use for this destination: its city, aliases and the
// neighborhoods or towns GlobTrek searches for hotels.
export function destinationPlaces(destination) {
  const names = [destination.city, ...(destination.hotelSearchCenters || []), ...(destination.hotelSearchAliases || []), ...(destination.feedCityAliases || [])];
  return [...new Set(names.map(normalizeName).filter(Boolean))];
}

export function budgetScore(row) {
  const stars = Number(row.starRating) || 0;
  let points = CATEGORY_WEIGHT[row.categoryName] || 0;
  if (row.categoryName === "Hotel" && stars && stars <= 2) points += 1;
  if (DORM.test(row.roomType || "")) points += 1.5;
  if (yes(row.freeCancellation)) points += 1;
  if (yes(row.freeInternet)) points += 0.5;
  if (yes(row.freeBreakfast)) points += 1;
  points += Math.min(10, (row.additionalImageLink || []).length) / 10;
  return Math.round(points * 10) / 10;
}

export function eligible(row) {
  const stars = Number(row.starRating) || 0;
  return Boolean(CATEGORY_WEIGHT[row.categoryName]) && stars <= MAX_STARS && !GENERIC_NAME.test(cleanText(row.title) || "");
}

// Shortlist across categories and star levels so hostels, guest houses, motels
// and simple hotels (the "upgrade" pool) all compete.
export function shortlist(rows, size = SHORTLIST) {
  const groups = new Map();
  for (const row of rows) {
    const stars = Number(row.starRating) || 0;
    const key = `${row.categoryName}|${stars >= 3 ? "upper" : "lower"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const ordered = [...groups.entries()].sort(([a], [b]) => (CATEGORY_WEIGHT[b.split("|")[0]] || 0) - (CATEGORY_WEIGHT[a.split("|")[0]] || 0));
  const picked = [];
  for (let round = 0; picked.length < size && ordered.some(([, items]) => items.length > round); round += 1) {
    for (const [, items] of ordered) if (items[round] && picked.length < size) picked.push(items[round]);
  }
  return picked;
}

// One feed record → one GlobTrek catalog record, or null when it fails validation.
export function normalizeRecord(row, { destinationId, feed, importedAt }) {
  const name = cleanText(row?.title);
  const page = httpsUrl(String(row?.link || "").split("?")[0], ["booking.com"]);
  const click = httpsUrl(row?.linkCode?.clickUrl, CJ_HOSTS);
  if (!row?.id || !name || !page || !page.pathname.startsWith("/hotel/") || !click || row.isDeleted === true) return null;
  const photos = [row.imageLink, ...(Array.isArray(row.additionalImageLink) ? row.additionalImageLink : [])].filter((src) => Boolean(httpsUrl(src, ["bstatic.com"])));
  const latitude = number(row.address?.latitude);
  const longitude = number(row.address?.longitude);
  const roomTypes = list(row.roomType);
  return {
    provider: "booking.com",
    providerPropertyId: String(row.id),
    destinationId,
    feedId: feed.adId,
    feedName: feed.name,
    feedUpdatedAt: feed.lastUpdated,
    productUpdatedAt: row.lastUpdated || null,
    importedAt,
    name,
    category: cleanText(row.categoryName),
    starRating: number(row.starRating) || null,
    description: (cleanText(row.description) || "").slice(0, 600) || null,
    bookingUrl: `${page.origin}${page.pathname}`,
    cjClickUrl: click.toString(),
    cjTrackingBaseUrl: `${click.origin}${click.pathname}`,
    streetAddress: cleanText(row.address?.streetAddress),
    city: cleanText(row.address?.city),
    provinceState: cleanText(row.address?.provinceState),
    postalCode: cleanText(row.address?.zipCode),
    country: cleanText(row.address?.country),
    latitude: latitude !== null && Math.abs(latitude) <= 90 ? latitude : null,
    longitude: longitude !== null && Math.abs(longitude) <= 180 ? longitude : null,
    photos: [...new Set(photos)].slice(0, 12),
    amenities: list(row.amenities).slice(0, 40),
    accessibility: list(row.accessibility).slice(0, 20),
    dining: cleanText(row.diningOptions),
    roomTypes: roomTypes.slice(0, 20),
    dorms: roomTypes.some((room) => DORM.test(room)),
    beds: number(row.beds),
    bedrooms: number(row.bedrooms),
    bathrooms: number(row.baths),
    bedsDescription: cleanText(row.bedsDescription),
    maxGuests: number(row.includedGuestsCount),
    // Catalog flags: true when Booking.com lists the option on at least some
    // rates. They are not the cancellation terms of any particular booking.
    catalogFreeCancellation: yes(row.freeCancellation),
    catalogFreeWifi: yes(row.freeInternet),
    catalogFreeBreakfast: yes(row.freeBreakfast),
    nearAirport: cleanText(row.proximityAirport),
    budgetScore: budgetScore(row),
  };
}

async function searchFeed(client, feed, keywords, maxPages = MAX_PAGES) {
  const rows = [];
  for (let page = 0; page < maxPages; page += 1) {
    const data = await client.query(`{ travelExperienceProducts(companyId: "${client.credentials.companyId}", adIds: ["${feed.adId}"], keywords: ${JSON.stringify(keywords)}, offset: ${page * PAGE}, limit: ${PAGE}) { totalCount count resultList { ${LIGHT} } } }`);
    const result = data?.travelExperienceProducts;
    const items = Array.isArray(result?.resultList) ? result.resultList : [];
    rows.push(...items);
    if (items.length < PAGE || (page + 1) * PAGE >= Number(result?.totalCount || 0)) break;
  }
  return rows;
}

const pagePath = (url) => String(url || "").split("?")[0].replace(/^https:\/\/www\.booking\.com\/hotel\//, "").replace(/(\.[a-z]{2}(-[a-z]{2})?)?\.html$/i, "");

// Feed rows for the destination's hand-verified stays, found by name and matched on the Booking.com page.
async function pinnedRows(client, feed, pins) {
  const rows = [];
  for (const pin of pins.slice(0, 5)) {
    const want = pagePath(pin.bookingUrl);
    if (!want || !pin.name) continue;
    const match = (await searchFeed(client, feed, pin.name, 1)).find((row) => pagePath(row.link) === want);
    if (match && eligible({ ...match, title: pin.name })) rows.push(match);
  }
  return rows;
}

export async function importDestination(client, destination, feeds, { importedAt = new Date().toISOString(), size = SHORTLIST } = {}) {
  const candidates = feedsForCountry(feeds, destination.country);
  if (!candidates.length) return { destinationId: destination.id, status: "skipped", reason: "no_feed_for_country", records: [] };
  const places = destinationPlaces(destination);
  const searches = [...new Set([destination.city, ...(destination.hotelSearchCenters || []).slice(0, 3)].map(titleCase))];
  for (const feed of candidates) {
    const seen = new Map();
    for (const place of searches) {
      for (const words of [`${place} hostel`, place]) {
        for (const row of await searchFeed(client, feed, words)) if (row?.id) seen.set(String(row.id), row);
      }
    }
    const named = [...seen.values()].filter((row) => places.includes(normalizeName(row.address?.city)));
    const inPlace = nearDestination(named, destination, (row) => ({ latitude: number(row.address?.latitude), longitude: number(row.address?.longitude) }));
    if (!inPlace.length) continue;
    const pinned = await pinnedRows(client, feed, destination.pinnedStays || []);
    const picks = [...pinned, ...shortlist(inPlace.filter((row) => eligible(row) && !pinned.some((pin) => pin.id === row.id)), size)];
    const records = [];
    let malformed = 0;
    for (let index = 0; index < picks.length; index += CHUNK) {
      const ids = picks.slice(index, index + CHUNK).map((row) => JSON.stringify(String(row.id)));
      const data = await client.query(`{ travelExperienceProducts(companyId: "${client.credentials.companyId}", adIds: ["${feed.adId}"], productIds: [${ids.join(",")}], limit: ${CHUNK}) { resultList { ${FULL_FIELDS(client.credentials.pid)} } } }`);
      for (const row of data?.travelExperienceProducts?.resultList || []) {
        const record = row?.joinedStatus === false ? null : normalizeRecord(row, { destinationId: destination.id, feed, importedAt });
        if (record) records.push(record); else malformed += 1;
      }
    }
    records.sort((a, b) => b.budgetScore - a.budgetScore || a.name.localeCompare(b.name));
    return { destinationId: destination.id, status: "ok", feed: { adId: feed.adId, name: feed.name, lastUpdated: feed.lastUpdated }, searched: seen.size, inDestination: inPlace.length, records, malformed };
  }
  return { destinationId: destination.id, status: "empty", reason: "no_listings_matched_destination", records: [] };
}

// store: { begin(run), save(result, run), finish(run) } — see catalogStore.js.
export async function runImport({ client, destinations, store = null, dryRun = true, trigger = "manual", logger = () => {}, now = () => new Date() }) {
  const run = { startedAt: now().toISOString(), dryRun, trigger, destinationsAttempted: destinations.length, destinationsSucceeded: 0, recordsSeen: 0, recordsSaved: 0, recordsDeactivated: 0, errors: [], feeds: [] };
  if (!client.credentials.configured) return { ...run, status: "failed", errors: [{ scope: "run", message: "cj_not_configured" }], finishedAt: now().toISOString() };
  if (store && !dryRun) await store.begin(run);
  try {
    run.feeds = await discoverFeeds(client);
  } catch (error) {
    run.errors.push({ scope: "feeds", message: String(error?.message || "feed_discovery_failed").slice(0, 200) });
  }
  if (run.feeds.length) {
    for (const destination of destinations) {
      try {
        const result = await importDestination(client, destination, run.feeds, { importedAt: run.startedAt });
        run.recordsSeen += result.records.length;
        if (result.status === "ok") {
          run.destinationsSucceeded += 1;
          if (store && !dryRun) {
            const saved = await store.save(result, run);
            run.recordsSaved += saved.saved;
            run.recordsDeactivated += saved.deactivated;
          }
        } else {
          run.errors.push({ scope: destination.id, message: result.reason });
        }
        logger({ msg: "catalog_destination_imported", destination: destination.id, status: result.status, records: result.records.length, inDestination: result.inDestination ?? 0, malformed: result.malformed ?? 0 });
      } catch (error) {
        run.errors.push({ scope: destination.id, message: String(error?.message || "import_failed").slice(0, 200) });
        logger({ msg: "catalog_destination_failed", destination: destination.id, error: String(error?.message || "import_failed").slice(0, 200) });
      }
    }
  }
  run.status = !run.feeds.length || run.destinationsSucceeded === 0 ? "failed" : run.errors.length ? "partial" : "succeeded";
  run.finishedAt = now().toISOString();
  run.requests = client.stats?.().requests ?? null;
  if (store && !dryRun) await store.finish(run);
  return run;
}
