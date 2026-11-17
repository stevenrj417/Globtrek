// Matches a hotel-selection sheet (9 hotels per guide place: 3 cheap, 3 average,
// 3 expensive) to real Booking.com properties in GlobTrek's CJ product feed, so
// guide pages can show them with real photos, the property page and a CJ click
// link. Hotels that can't be found in the feed by name near the place are left
// out. No prices come from the sheet or the feed: pages show the place's
// typical nightly price for each tier from GlobTrek's regional price bands.
//   node scripts/guides/match-hotel-picks.mjs <globtrek-hotel-selection.xlsx> [--only LIS,town:bend-or] [--resume] [--refilter]
// Writes app/data/guideHotelPicks.json. Needs CJ_API_TOKEN, CJ_COMPANY_ID and
// CJ_PID in the environment or .env.local.
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

for (const line of (await readFile(new URL("../../.env.local", import.meta.url), "utf8").catch(() => "")).split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?\s*$/);
  if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
}

const { GUIDE_TOWNS } = await import("../../app/data/guideTowns.js");
const { GUIDES } = await import("../../app/data/guides.js");
const { destinations } = await import("../../app/data/destinations.js");
const { createCjClient } = await import("../../app/lib/catalog/cjClient.js");
const { discoverFeeds, feedsForCountry, normalizeRecord, normalizeName, FULL_FIELDS } = await import("../../app/lib/catalog/cjBookingImporter.js");
const { distanceKm } = await import("../../app/lib/catalog/nearDestination.js");

const args = process.argv.slice(2);
const workbookPath = args.find((arg) => /\.xlsx$/i.test(arg));
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
if (!workbookPath) { console.error("Pass the .xlsx path."); process.exit(1); }

// --- Minimal .xlsx reader (first sheet; macOS and Linux ship `unzip`). ---
const part = (name) => { try { return execFileSync("unzip", ["-p", workbookPath, name], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }); } catch { return ""; } };
const decode = (value) => value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16))).replace(/&amp;/g, "&");
const texts = (xml) => [...xml.matchAll(/<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>/g)].map((match) => decode(match[1])).join("");
const shared = [...part("xl/sharedStrings.xml").matchAll(/<(?:\w+:)?si>([\s\S]*?)<\/(?:\w+:)?si>/g)].map((match) => texts(match[1]));
const columnIndex = (letters) => [...letters].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
const sheetRows = [...part("xl/worksheets/sheet1.xml").matchAll(/<(?:\w+:)?row\b[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g)].map(([, row]) => {
  const cells = [];
  for (const [, attributes, body] of row.matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
    const type = attributes.match(/t="([^"]+)"/)?.[1];
    const value = body?.match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/)?.[1];
    cells[columnIndex(attributes.match(/r="([A-Z]+)\d+"/)[1])] = type === "s" ? shared[Number(value)] : type === "inlineStr" ? texts(body || "") : value == null ? null : decode(value);
  }
  return cells;
});
const header = sheetRows[0].map((value) => String(value ?? "").trim());
for (const column of ["place_id", "place", "guide_pages", "tier", "slot", "hotel_name"]) if (!header.includes(column)) { console.error(`Sheet is missing ${column}`); process.exit(1); }
const rows = sheetRows.slice(1).map((row) => Object.fromEntries(header.map((column, index) => [column, row[index] ?? null]))).filter((row) => row.place_id && row.hotel_name);

// --- Where each sheet place is: a guide area, a guide town, or the destination. ---
const destinationById = new Map(destinations.map((item) => [item.id, item]));
const guideBySlug = new Map(GUIDES.map((guide) => [guide.slug, guide]));
function placeInfo(row) {
  const slugs = String(row.guide_pages || "").split(/\s+/).filter((slug) => guideBySlug.has(slug));
  if (row.place_id.startsWith("town:")) {
    const town = GUIDE_TOWNS[row.place_id.slice(5)];
    return town ? { slugs, country: "UNITED STATES", point: { latitude: town.latitude, longitude: town.longitude }, radiusKm: 30 } : null;
  }
  const destination = destinationById.get(row.place_id);
  if (!destination) return null;
  const area = slugs.map((slug) => guideBySlug.get(slug).area).find((item) => item?.town && Number.isFinite(item.latitude));
  const point = area ? { latitude: area.latitude, longitude: area.longitude } : { latitude: destination.latitude, longitude: destination.longitude };
  return { slugs, country: destination.country, point, radiusKm: area ? 20 : 40 };
}

// Words that don't tell two hotels apart.
const FILLER = new Set(["the", "a", "an", "and", "at", "by", "of", "in", "on", "hotel", "hotels", "hostel", "inn", "suites", "suite", "resort", "spa", "motel", "lodge", "apartments", "apartment", "residence", "boutique", "house", "guesthouse", "guest", "b", "bb", "y", "de", "la", "le", "el", "del", "di", "da", "&"]);
const words = (value) => normalizeName(value).split(" ").filter((word) => word && !FILLER.has(word));
// A feed listing is the sheet's hotel only when every telling word of the
// sheet's name is in the listing's name (the place's own name may be left
// out), the name says more than just the place, and it isn't a rental, guest
// house or resale listing that shares the name.
const RENTAL = /apartment|holiday home|villa|vacation|chalet|homestay|guest ?house/i;
const RESALE = /\bby suiteness\b/i;
// Words a listing name often drops for the same hotel.
const LOOSE = new Set(["centro", "centre", "center", "downtown", "city", "collection", "by"]);
function placeWords(row) {
  const destination = destinationById.get(row.place_id);
  const town = row.place_id.startsWith("town:") ? GUIDE_TOWNS[row.place_id.slice(5)] : null;
  return new Set([row.place, destination?.city, destination?.name, town?.name, town?.state].flatMap((value) => words(value || "")));
}
export function acceptMatch(wanted, title, category, nearby) {
  if (RESALE.test(title || "")) return 0;
  if (normalizeName(wanted) === normalizeName(title)) return 1;
  if (RENTAL.test(category || "") && !/apartment|residence|guest/i.test(wanted)) return 0;
  if (/\bhotel\b/i.test(wanted) && /hostel/i.test(category || "")) return 0;
  if (!words(wanted).some((word) => !nearby.has(word))) return 0;
  const want = words(wanted).filter((word) => !LOOSE.has(word));
  const have = new Set(words(title));
  if (want.some((word) => !have.has(word) && !nearby.has(word))) return 0;
  return want.filter((word) => have.has(word)).length / have.size;
}

if (args.includes("--refilter")) {
  // Re-check saved matches against the current rules, without calling CJ.
  const outUrl = new URL("../../app/data/guideHotelPicks.json", import.meta.url);
  const out = JSON.parse(await readFile(outUrl, "utf8"));
  for (const place of Object.values(out.places)) {
    const row = rows.find((item) => item.place_id === place.placeId && item.place === place.place);
    const nearby = placeWords(row);
    const keep = place.hotels.filter((hotel) => {
      const wanted = hotel.pickedAs || rows.find((item) => item.place_id === place.placeId && item.place === place.place && item.tier === hotel.tier && Number(item.slot) === hotel.slot)?.hotel_name;
      const ok = wanted && acceptMatch(wanted, hotel.name, hotel.category, nearby) > 0;
      if (!ok) { console.log(`dropped ${place.place}: ${wanted} => ${hotel.name} (${hotel.category})`); place.missed.push(`${hotel.tier} ${wanted}`); }
      else hotel.pickedAs = wanted;
      return ok;
    });
    place.hotels = keep;
  }
  await writeFile(outUrl, `${JSON.stringify(out)}\n`);
  process.exit(0);
}

const client = createCjClient();
if (!client.credentials.configured) { console.error("CJ credentials are not set."); process.exit(1); }
const feeds = await discoverFeeds(client);
const outUrl = new URL("../../app/data/guideHotelPicks.json", import.meta.url);
const out = JSON.parse(await readFile(outUrl, "utf8").catch(() => '{"places":{}}'));
const SEARCH_FIELDS = "id title link categoryName starRating address { city latitude longitude }";
const importedAt = new Date().toISOString();

const groups = new Map();
for (const row of rows) {
  const key = `${row.place_id}|${row.place}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}

for (const [key, items] of groups) {
  if (only && !only.includes(items[0].place_id)) continue;
  if (!only && args.includes("--resume") && out.places[key]) continue;
  const info = placeInfo(items[0]);
  if (!info) { console.log(`${key}: unknown place, skipped`); continue; }
  const placeFeeds = feedsForCountry(feeds, info.country);
  const nearby = placeWords(items[0]);
  const picks = [];
  const missed = [];
  for (const row of items) {
    let best = null;
    for (const feed of placeFeeds) {
      // Punctuation can break CJ's keyword search, so search plain words.
      const keywords = normalizeName(row.hotel_name);
      const data = await client.query(`{ travelExperienceProducts(companyId: "${client.credentials.companyId}", adIds: ["${feed.adId}"], keywords: ${JSON.stringify(keywords)}, limit: 200) { resultList { ${SEARCH_FIELDS} } } }`).catch((error) => { console.log(`  search failed for ${row.hotel_name}: ${error.message}`); return null; });
      for (const candidate of data?.travelExperienceProducts?.resultList || []) {
        const latitude = Number(candidate.address?.latitude);
        const longitude = Number(candidate.address?.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || distanceKm(info.point, { latitude, longitude }) > info.radiusKm) continue;
        const score = acceptMatch(row.hotel_name, candidate.title, candidate.categoryName, nearby);
        if (score > 0 && (!best || score > best.score)) best = { score, feed, id: String(candidate.id) };
      }
      if (best) break;
    }
    if (best && !picks.some((pick) => pick.id === best.id)) picks.push({ ...best, row });
    else missed.push(`${row.tier} ${row.hotel_name}`);
  }
  const records = [];
  for (const feed of placeFeeds) {
    const ids = picks.filter((pick) => pick.feed.adId === feed.adId).map((pick) => JSON.stringify(pick.id));
    if (!ids.length) continue;
    const data = await client.query(`{ travelExperienceProducts(companyId: "${client.credentials.companyId}", adIds: ["${feed.adId}"], productIds: [${ids.join(",")}], limit: 50) { resultList { ${FULL_FIELDS(client.credentials.pid)} } } }`);
    for (const row of data?.travelExperienceProducts?.resultList || []) {
      const record = row?.joinedStatus === false ? null : normalizeRecord(row, { destinationId: items[0].place_id, feed, importedAt });
      const pick = record && picks.find((item) => item.id === record.providerPropertyId);
      if (pick) records.push({
        tier: pick.row.tier,
        pickedAs: pick.row.hotel_name,
        slot: Number(pick.row.slot) || 0,
        id: `cj-${record.providerPropertyId}`,
        name: record.name,
        category: record.category,
        starRating: record.starRating,
        city: record.city,
        address: [record.streetAddress, record.city, record.provinceState, record.postalCode].filter(Boolean).join(", ") || null,
        latitude: record.latitude,
        longitude: record.longitude,
        photos: record.photos.slice(0, 3),
        bookingUrl: record.bookingUrl,
        cjClickUrl: record.cjClickUrl,
        catalogFreeCancellation: record.catalogFreeCancellation,
        catalogFreeBreakfast: record.catalogFreeBreakfast,
      });
    }
  }
  records.sort((a, b) => ["cheap", "average", "expensive"].indexOf(a.tier) - ["cheap", "average", "expensive"].indexOf(b.tier) || a.slot - b.slot);
  out.places[key] = { placeId: items[0].place_id, place: items[0].place, guides: info.slugs, hotels: records, missed, importedAt };
  console.log(`${key.padEnd(40)} ${records.length}/${items.length} matched${missed.length ? `  missed: ${missed.join("; ")}` : ""}`);
  out.source = "Hotel picks matched to Booking.com listings in GlobTrek's CJ Affiliate product feed";
  out.checkedAt = importedAt.slice(0, 10);
  await writeFile(outUrl, `${JSON.stringify(out)}\n`);
}
