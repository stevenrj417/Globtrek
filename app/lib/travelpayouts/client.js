// Server-only Travelpayouts client: Aviasales Data API (cached fares), the
// partner links API and the booking statistics API.
//
// Every Aviasales Data API price is a fare that Aviasales users found in recent
// searches (cached up to 7 days), not a live quote. Normalized results keep the
// time each fare was found so the site can say how old it is.
// Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163
// The token goes in the X-Access-Token header only: never in URLs, logs,
// responses or client code.

export const TP_BASE = "https://api.travelpayouts.com";
const TIMEOUT_MS = 8000;
const IATA = /^[A-Z]{3}$/;
const MONTH_OR_DATE = /^\d{4}-\d{2}(-\d{2})?$/;

export function travelpayoutsConfig(env = process.env) {
  const token = env.TRAVELPAYOUTS_API_TOKEN || env.TRAVELPAYOUTS_TOKEN || "";
  const marker = String(env.TRAVELPAYOUTS_MARKER || "").trim();
  const projectId = String(env.TRAVELPAYOUTS_PROJECT_ID || "").trim();
  return { token, marker, projectId, configured: Boolean(token) };
}

export class TravelpayoutsError extends Error {
  constructor(code, status = 0) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

async function request(path, { token, fetchImpl = fetch, query, body, method = body ? "POST" : "GET" }) {
  if (!token) throw new TravelpayoutsError("token_missing");
  const url = new URL(path, TP_BASE);
  for (const [key, value] of Object.entries(query || {})) if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      method,
      headers: { "X-Access-Token": token, "Accept-Encoding": "gzip, deflate", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403) throw new TravelpayoutsError("unauthorized", response.status);
    if (response.status === 429) throw new TravelpayoutsError("rate_limited", 429);
    const json = await response.json().catch(() => null);
    if (!response.ok) throw new TravelpayoutsError(json?.code || `http_${response.status}`, response.status);
    return json;
  } catch (error) {
    if (error instanceof TravelpayoutsError) throw error;
    throw new TravelpayoutsError(error?.name === "AbortError" ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }
}

function iata(value, field) {
  const code = String(value || "").toUpperCase();
  if (!IATA.test(code)) throw new TravelpayoutsError(`invalid_${field}`);
  return code;
}

function when(value, field) {
  if (value === undefined || value === null || value === "") return undefined;
  if (!MONTH_OR_DATE.test(String(value))) throw new TravelpayoutsError(`invalid_${field}`);
  return String(value);
}

const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);
const day = (value) => (typeof value === "string" && value.length >= 10 ? value.slice(0, 10) : null);

// One fare in GlobTrek's shape. `roundTrip` is true only when the data has a
// return date; one-way fares are never presented as round trips. Prices are
// per passenger in `currency`.
export function normalizeFare(item, { currency = "usd", roundTrip } = {}) {
  const price = num(item?.price ?? item?.value);
  if (!price || price <= 0) return null;
  const returnDate = day(item.return_at || item.return_date);
  return {
    origin: item.origin || null,
    destination: item.destination || null,
    originAirport: item.origin_airport || item.origin || null,
    destinationAirport: item.destination_airport || item.destination || null,
    departDate: day(item.departure_at || item.depart_date),
    returnDate,
    roundTrip: roundTrip ?? Boolean(returnDate),
    pricePerPerson: Math.round(price),
    currency: String(currency).toUpperCase(),
    airline: item.airline || null,
    stops: num(item.transfers ?? item.number_of_changes),
    returnStops: num(item.return_transfers),
    durationMinutes: num(item.duration),
    foundAt: item.found_at || null,
    expiresAt: item.expires_at || null,
    searchPath: typeof item.link === "string" && item.link.startsWith("/search/") ? item.link : null,
    source: "aviasales_cache",
  };
}

const list = (json) => (Array.isArray(json?.data) ? json.data : []);

// Cheapest fares for specific dates or months (last 48 hours of searches).
export async function pricesForDates({ origin, destination, departureAt, returnAt, oneWay = !returnAt, direct = false, currency = "usd", market = "us", limit = 30, ...options }) {
  const json = await request("/aviasales/v3/prices_for_dates", {
    ...options,
    query: { origin: iata(origin, "origin"), destination: iata(destination, "destination"), departure_at: when(departureAt, "departure"), return_at: when(returnAt, "return"), one_way: String(oneWay), direct: String(direct), currency, market, limit, sorting: "price", unique: "false" },
  });
  return list(json).map((item) => normalizeFare(item, { currency, roundTrip: !oneWay })).filter(Boolean);
}

// Cheapest fare per departure date (or month) in a month.
export async function groupedPrices({ origin, destination, departureAt, groupBy = "departure_at", minTripDays, maxTripDays, currency = "usd", market = "us", ...options }) {
  const json = await request("/aviasales/v3/grouped_prices", {
    ...options,
    query: { origin: iata(origin, "origin"), destination: iata(destination, "destination"), departure_at: when(departureAt, "departure"), group_by: groupBy, min_trip_duration: minTripDays, max_trip_duration: maxTripDays, currency, market },
  });
  const data = json?.data && typeof json.data === "object" ? Object.values(json.data) : [];
  return data.map((item) => normalizeFare(item, { currency })).filter(Boolean);
}

// Fares found for a period ("month" needs beginningOfPeriod as YYYY-MM-01).
export async function latestPrices({ origin, destination, beginningOfPeriod, periodType = "month", oneWay = false, tripDuration, currency = "usd", market = "us", ...options }) {
  const json = await request("/aviasales/v3/get_latest_prices", {
    ...options,
    query: { origin: iata(origin, "origin"), destination: destination ? iata(destination, "destination") : undefined, beginning_of_period: when(beginningOfPeriod, "period"), period_type: periodType, one_way: String(oneWay), trip_duration: tripDuration, currency, market, sorting: "price", show_to_affiliates: "true", limit: 30 },
  });
  return list(json).map((item) => normalizeFare(item, { currency, roundTrip: !oneWay })).filter(Boolean);
}

// Destinations reachable from an origin within a price range.
export async function searchByPriceRange({ origin, valueMin = 0, valueMax, oneWay = false, direct = false, currency = "usd", market = "us", limit = 30, ...options }) {
  const json = await request("/aviasales/v3/search_by_price_range", {
    ...options,
    query: { origin: iata(origin, "origin"), value_min: valueMin, value_max: valueMax, one_way: String(oneWay), direct: String(direct), currency, market, limit, page: 1 },
  });
  return list(json).map((item) => normalizeFare(item, { currency, roundTrip: !oneWay })).filter(Boolean);
}

// Origins most often searched for a destination, with their cheapest fare.
export async function popularDirections({ destination, currency = "usd", locale = "en", limit = 10, ...options }) {
  const json = await request("/aviasales/v3/get_popular_directions", { ...options, query: { destination: iata(destination, "destination"), currency, locale, limit, page: 1 } });
  const origins = Array.isArray(json?.data?.origin) ? json.data.origin : [];
  return origins.map((item) => ({ origin: item.city_iata || null, city: item.city_name || null, departDate: day(item.departure_at), returnDate: day(item.return_at), pricePerPerson: num(item.price), currency: String(currency).toUpperCase(), source: "aviasales_cache" })).filter((item) => item.origin && item.pricePerPerson);
}

// Airline special offers from an origin.
export async function specialOffers({ origin, destination, currency = "usd", market = "us", locale = "en", ...options }) {
  const json = await request("/aviasales/v3/get_special_offers", { ...options, query: { origin: iata(origin, "origin"), destination: destination ? iata(destination, "destination") : undefined, currency, market, locale } });
  return list(json).map((item) => normalizeFare(item, { currency })).filter(Boolean);
}

// Fares between airports near the origin and destination.
export async function nearestPlaces({ origin, destination, departMonth, returnMonth, distance = 300, limit = 10, currency = "usd", market = "us", ...options }) {
  const json = await request("/v2/prices/nearest-places-matrix", {
    ...options,
    query: { origin: iata(origin, "origin"), destination: iata(destination, "destination"), depart_date: when(departMonth, "departure"), return_date: when(returnMonth, "return"), distance, limit, currency, market, show_to_affiliates: "true", flexibility: 0 },
  });
  const prices = Array.isArray(json?.prices) ? json.prices : [];
  return prices.map((item) => normalizeFare(item, { currency })).filter(Boolean);
}

// Private reporting: affiliate actions for a date range.
export async function bookingStatistics({ campaignId, from, to, group = [], fields, ...options }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) throw new TravelpayoutsError("invalid_period");
  const filters = [{ field: "date", op: "ge", value: from }, { field: "date", op: "le", value: to }];
  if (campaignId) filters.push({ field: "campaign_id", op: "eq", value: Number(campaignId) });
  const json = await request("/statistics/v1/execute_query", {
    ...options,
    body: { fields: fields || ["campaign_id", "redirects_count", "processing_actions_count", "paid_actions_count", "cancelled_actions_count", "paid_profit_usd_sum", "processing_profit_usd_sum"], filters, group: group.length ? group : ["campaign_id"], offset: 0, limit: 500 },
  });
  return { rows: Array.isArray(json?.results) ? json.results : [], totalRows: num(json?.total_rows) ?? 0 };
}

export async function statisticsFields(options) {
  const json = await request("/statistics/v1/get_fields_list", { ...options, query: { data_type: "aggregated" } });
  return Array.isArray(json?.fields) ? json.fields.map((field) => field.name) : [];
}

export { request as travelpayoutsRequest };
