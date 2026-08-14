import { createHash } from "node:crypto";

export const CJ_STAYS_URL = "https://www.kqzyfj.com/click-101801755-17293132";

export function normalizeName(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function providerPropertyId(url) {
  try {
    const pathname = new URL(url).pathname;
    return pathname.match(/\/hotel\/[^/]+\/([^/.]+)\.html$/)?.[1] || null;
  } catch { return null; }
}

export function validCjTrackingUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["kqzyfj.com", "dpbolvw.net", "jdoqocy.com", "tkqlhce.com", "anrdoezrs.net"].some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`)) && /\/click-\d+-\d+/.test(url.pathname);
  } catch { return false; }
}

export function isStale(value, days = 180, now = Date.now()) {
  const timestamp = Date.parse(value || "");
  return !Number.isFinite(timestamp) || now - timestamp > days * 86400000;
}

export function stableHotelId(record) {
  return createHash("sha256").update(`${record.destinationId}|${normalizeName(record.name)}|${record.provider}`).digest("hex").slice(0, 24);
}

export function validateHotel(record, destinationIds = new Set()) {
  const errors = [];
  if (!String(record.name || "").trim()) errors.push("missing_name");
  if (!String(record.destinationId || "").trim()) errors.push("missing_destination");
  else if (destinationIds.size && !destinationIds.has(record.destinationId)) errors.push("destination_mismatch");
  if (!String(record.provider || "").trim()) errors.push("missing_provider");
  if (record.cjTrackingUrl && !validCjTrackingUrl(record.cjTrackingUrl)) errors.push("invalid_cj_url");
  if (record.bookingComPropertyUrl) {
    try {
      const url = new URL(record.bookingComPropertyUrl);
      if (url.protocol !== "https:" || !/(^|\.)booking\.com$/.test(url.hostname) || !/\/hotel\//.test(url.pathname)) errors.push("invalid_booking_url");
    } catch { errors.push("invalid_booking_url"); }
  } else errors.push("missing_booking_url");
  if (record.latitude != null && (!Number.isFinite(Number(record.latitude)) || Number(record.latitude) < -90 || Number(record.latitude) > 90)) errors.push("invalid_latitude");
  if (record.longitude != null && (!Number.isFinite(Number(record.longitude)) || Number(record.longitude) < -180 || Number(record.longitude) > 180)) errors.push("invalid_longitude");
  const low = record.typicalNightlyLow == null ? null : Number(record.typicalNightlyLow);
  const high = record.typicalNightlyHigh == null ? null : Number(record.typicalNightlyHigh);
  if ((low != null && (!Number.isFinite(low) || low < 0)) || (high != null && (!Number.isFinite(high) || high < 0 || (low != null && high < low)))) errors.push("malformed_price");
  return [...new Set(errors)];
}

export function normalizeHotel(record, destination) {
  const bookingComPropertyUrl = record.bookingComPropertyUrl || record.bookingUrl || null;
  return {
    id: record.id || stableHotelId({ destinationId: record.destinationId, name: record.name, provider: record.provider || "booking_com_cj" }),
    name: String(record.name || "").trim(),
    normalizedName: normalizeName(record.name),
    destinationId: record.destinationId,
    city: record.city || destination?.city || null,
    region: record.region || null,
    country: record.country || destination?.country || null,
    latitude: record.latitude ?? null,
    longitude: record.longitude ?? null,
    bookingComPropertyUrl,
    cjTrackingUrl: record.cjTrackingUrl || CJ_STAYS_URL,
    provider: record.provider || "booking_com_cj",
    providerPropertyId: record.providerPropertyId || providerPropertyId(bookingComPropertyUrl),
    typicalNightlyLow: record.typicalNightlyLow ?? null,
    typicalNightlyHigh: record.typicalNightlyHigh ?? null,
    currency: record.currency || null,
    priceConfidence: record.priceConfidence ?? null,
    priceLastChecked: record.priceLastChecked ?? null,
    priceSource: record.priceSource || null,
    description: record.description || null,
    styleTags: [...new Set(record.styleTags || record.tags || [])],
    amenityTags: [...new Set(record.amenityTags || [])],
    imageUrl: record.imageUrl || null,
    imageSource: record.imageSource || null,
    imageLicenseMetadata: record.imageLicenseMetadata || null,
    verifiedAt: record.verifiedAt || null,
    verificationSource: record.verificationSource || "legacy_curated_catalog",
    reviewStatus: record.reviewStatus || "needs_review",
    active: record.active !== false,
  };
}

export function importBatch(records, destinations, existing = []) {
  const destinationMap = new Map(destinations.map((item) => [item.airport || item.id, item]));
  const destinationIds = new Set(destinationMap.keys());
  const seen = new Set(existing.map((item) => `${item.destinationId}|${normalizeName(item.name)}|${item.provider}`));
  const imported = [];
  const rejected = [];
  let duplicates = 0;
  for (const input of records) {
    const normalized = normalizeHotel(input, destinationMap.get(input.destinationId));
    const errors = validateHotel(normalized, destinationIds);
    const key = `${normalized.destinationId}|${normalized.normalizedName}|${normalized.provider}`;
    if (seen.has(key)) { duplicates += 1; rejected.push({ record: input, errors: ["duplicate"] }); continue; }
    if (errors.length) { rejected.push({ record: input, errors }); continue; }
    seen.add(key);
    imported.push(normalized);
  }
  return { submitted: records.length, imported: imported.length, duplicates, invalid: rejected.length - duplicates, records: imported, rejected };
}
