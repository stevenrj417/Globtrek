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
    luxuryScore: record.luxuryScore ?? null,
    relaxationScore: record.relaxationScore ?? null,
    designScore: record.designScore ?? null,
    nightlifeScore: record.nightlifeScore ?? null,
    energyScore: record.energyScore ?? null,
    localFeelScore: record.localFeelScore ?? null,
    familyScore: record.familyScore ?? null,
    romanticScore: record.romanticScore ?? null,
    centralityScore: record.centralityScore ?? null,
    valueScore: record.valueScore ?? null,
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

export function validatePriceObservation(record) {
  const errors = [];
  if (!record.hotelId) errors.push("missing_hotel_id");
  try { const url = new URL(record.sourceUrl); if (url.protocol !== "https:") errors.push("invalid_source_url"); } catch { errors.push("invalid_source_url"); }
  const observedAt = Date.parse(record.observedAt || "");
  const checkIn = Date.parse(`${record.checkIn || ""}T00:00:00Z`);
  const checkOut = Date.parse(`${record.checkOut || ""}T00:00:00Z`);
  if (!Number.isFinite(observedAt)) errors.push("invalid_observed_at");
  if (!Number.isFinite(checkIn) || !Number.isFinite(checkOut) || checkOut <= checkIn) errors.push("invalid_stay_dates");
  if (!/^[A-Z]{3}$/.test(String(record.currency || ""))) errors.push("invalid_currency");
  if (!Number.isFinite(Number(record.totalPrice)) || Number(record.totalPrice) <= 0) errors.push("invalid_total_price");
  if (record.isLive !== true) errors.push("observation_not_live");
  return [...new Set(errors)];
}

export function deriveTypicalPriceRange(observations, { minimumObservations = 3 } = {}) {
  const valid = observations.filter((item) => validatePriceObservation(item).length === 0);
  if (valid.length < minimumObservations) return { ready: false, reason: "insufficient_observations", observationCount: valid.length };
  const currencies = new Set(valid.map((item) => item.currency));
  if (currencies.size !== 1) return { ready: false, reason: "mixed_currencies", observationCount: valid.length };
  const months = new Set(valid.map((item) => item.checkIn.slice(0, 7)));
  if (months.size < 2) return { ready: false, reason: "insufficient_season_coverage", observationCount: valid.length };
  const nightly = valid.map((item) => Number(item.totalPrice) / Math.max(1, Math.round((Date.parse(`${item.checkOut}T00:00:00Z`) - Date.parse(`${item.checkIn}T00:00:00Z`)) / 86400000))).sort((a, b) => a - b);
  const percentile = (ratio, round) => nightly[Math.min(nightly.length - 1, Math.max(0, round((nightly.length - 1) * ratio)))];
  return { ready: true, typicalNightlyLow: Math.round(percentile(0.25, Math.floor)), typicalNightlyHigh: Math.round(percentile(0.75, Math.ceil)), currency: valid[0].currency, priceSource: "observed_provider_rates", priceLastChecked: new Date(Math.max(...valid.map((item) => Date.parse(item.observedAt)))).toISOString(), priceConfidence: Math.min(0.85, 0.45 + valid.length * 0.05 + months.size * 0.03), observationCount: valid.length, observedMonths: [...months].sort(), isLive: false };
}
