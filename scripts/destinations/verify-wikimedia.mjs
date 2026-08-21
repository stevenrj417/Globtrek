import { readFile, writeFile } from "node:fs/promises";
import { destinationId, validateDestination } from "./catalog-tools.mjs";

const COST_PROFILES = {
  affordable: { typicalHotelNightLow: 55, typicalHotelNightHigh: 160, foodDailyLow: 25, foodDailyHigh: 65, activitiesDailyLow: 10, activitiesDailyHigh: 50, transportDailyLow: 6, transportDailyHigh: 25 },
  moderate: { typicalHotelNightLow: 110, typicalHotelNightHigh: 260, foodDailyLow: 45, foodDailyHigh: 100, activitiesDailyLow: 20, activitiesDailyHigh: 80, transportDailyLow: 12, transportDailyHigh: 45 },
  upscale: { typicalHotelNightLow: 190, typicalHotelNightHigh: 480, foodDailyLow: 70, foodDailyHigh: 160, activitiesDailyLow: 35, activitiesDailyHigh: 130, transportDailyLow: 20, transportDailyHigh: 75 },
  luxury: { typicalHotelNightLow: 320, typicalHotelNightHigh: 900, foodDailyLow: 100, foodDailyHigh: 240, activitiesDailyLow: 60, activitiesDailyHigh: 220, transportDailyLow: 35, transportDailyHigh: 140 },
};

function stripHtml(value) { return String(value || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim(); }
function climateProfile(latitude) {
  const absolute = Math.abs(latitude);
  return { zone: absolute < 23.5 ? "tropical" : absolute < 40 ? "warm_temperate" : absolute < 60 ? "temperate" : "cool", source: "latitude_zone_model", confidence: 0.42 };
}
function seasonality(latitude) {
  return { hemisphere: latitude < 0 ? "southern" : "northern", source: "hemisphere_baseline", confidence: 0.35, note: "Destination-specific weather and events require editorial review." };
}

async function json(url, fetchImpl) {
  const response = await fetchImpl(url, { headers: { "User-Agent": "GlobtrekCatalog/1.0 (https://www.glob-trek.com/contact)" } });
  if (!response.ok) throw new Error(`http_${response.status}`);
  return response.json();
}

export async function verifyCandidate(candidate, fetchImpl = fetch) {
  const wiki = new URL("https://en.wikipedia.org/w/api.php");
  wiki.search = new URLSearchParams({ action: "query", format: "json", formatversion: "2", redirects: "1", prop: "coordinates|pageimages|info", inprop: "url", piprop: "name|original", titles: candidate.wikiTitle });
  const data = await json(wiki, fetchImpl);
  const page = data.query?.pages?.[0];
  const coordinate = page?.coordinates?.[0];
  if (!page || page.missing || !coordinate || !page.pageimage || !page.fullurl) throw new Error("destination_or_hero_not_verified");

  const commons = new URL("https://commons.wikimedia.org/w/api.php");
  commons.search = new URLSearchParams({ action: "query", format: "json", formatversion: "2", prop: "imageinfo", iiprop: "url|size|extmetadata", titles: `File:${page.pageimage}` });
  const media = (await json(commons, fetchImpl)).query?.pages?.[0]?.imageinfo?.[0];
  const metadata = media?.extmetadata || {};
  const licenseName = stripHtml(metadata.LicenseShortName?.value);
  if (!media?.url || !licenseName || /non.?commercial|fair use/i.test(`${licenseName} ${metadata.UsageTerms?.value || ""}`)) throw new Error("image_license_not_verified");
  const verifiedAt = new Date().toISOString();
  const image = { imageUrl: media.thumburl || media.url, sourcePageUrl: media.descriptionurl, sourceName: "Wikimedia Commons", author: stripHtml(metadata.Artist?.value), licenseName, licenseUrl: metadata.LicenseUrl?.value || null, attributionText: stripHtml(metadata.Credit?.value) || stripHtml(metadata.Attribution?.value) || stripHtml(metadata.Artist?.value), width: media.width, height: media.height, verifiedAt, isHero: true };
  const result = {
    ...candidate,
    id: destinationId(candidate.name, candidate.country),
    latitude: coordinate.lat,
    longitude: coordinate.lon,
    recognitionScore: candidate.knownnessScore,
    unknownnessScore: 100 - candidate.knownnessScore,
    currency: "USD",
    costProfile: { ...COST_PROFILES[candidate.costLevel], source: "globtrek_editorial_cost_tier_v1", confidence: 0.3, lastUpdated: verifiedAt.slice(0, 10) },
    seasonality: seasonality(coordinate.lat),
    climateProfile: climateProfile(coordinate.lat),
    tripLengthFit: { minimumNights: 3, typicalNights: 7, maximumNights: 14, confidence: 0.35 },
    accessibilityProfile: { nearestAirport: candidate.nearestAirport, transferDetailsVerified: false },
    images: [image],
    primaryImageUrl: image.imageUrl,
    imageSource: image.sourceName,
    imageLicenseMetadata: image,
    verifiedAt,
    verificationSource: page.fullurl,
    active: true,
  };
  const errors = validateDestination(result);
  if (errors.length) throw new Error(errors.join(","));
  return result;
}

export async function verifyBatch(candidates, fetchImpl = fetch, maximumVerified = Number.POSITIVE_INFINITY, delayMs = 0) {
  const verified = [];
  const rejected = [];
  for (const candidate of candidates) {
    if (verified.length >= maximumVerified) break;
    try { verified.push(await verifyCandidate(candidate, fetchImpl)); }
    catch (error) { rejected.push({ candidate, error: error.message }); }
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return { submitted: candidates.length, verified: verified.length, rejected: rejected.length, records: verified, failures: rejected };
}

if (process.argv[1]?.endsWith("verify-wikimedia.mjs")) {
  const input = process.argv[2] || "scripts/destinations/seed-batch-01.json";
  const output = process.argv[3] || "scripts/destinations/verified-batch-01.json";
  const limitIndex = process.argv.indexOf("--limit");
  const maximumVerified = limitIndex >= 0 ? Number(process.argv[limitIndex + 1]) : Number.POSITIVE_INFINITY;
  const delayIndex = process.argv.indexOf("--delay");
  const delayMs = delayIndex >= 0 ? Number(process.argv[delayIndex + 1]) : 0;
  const resume = process.argv.includes("--resume");
  let prior = null;
  if (resume) { try { prior = JSON.parse(await readFile(output, "utf8")); } catch {} }
  const candidates = prior ? prior.failures.map((item) => item.candidate) : JSON.parse(await readFile(input, "utf8"));
  const needed = Math.max(0, maximumVerified - (prior?.records.length || 0));
  const next = await verifyBatch(candidates, fetch, needed, delayMs);
  const report = prior ? { submitted: prior.submitted, verified: prior.records.length + next.records.length, rejected: next.failures.length, records: [...prior.records, ...next.records], failures: next.failures } : next;
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ submitted: report.submitted, verified: report.verified, rejected: report.rejected, output }, null, 2));
  if (report.rejected) console.error(JSON.stringify(report.failures, null, 2));
}
