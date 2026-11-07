// Travelpayouts (Aviasales Data API) flight prices.
//
// grouped_prices returns, for each departure date in a month, the cheapest round
// trip that Aviasales travelers found in the last 48 hours (cached up to 7 days).
// These are real fares, not live quotes, so GlobTrek turns them into two-week
// averages and labels them with the date they were checked.
// Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API
// The token is server-only: pass it in the X-Access-Token header, never to the browser.

export const API_BASE = "https://api.travelpayouts.com/aviasales/v3/grouped_prices";

export function groupedPricesUrl({ origin, destination, month, minTripDays = 2, maxTripDays = 8, currency = "usd", market = "us" }) {
  const params = new URLSearchParams({
    origin, destination, departure_at: month, group_by: "departure_at", currency, market,
    min_trip_duration: String(minTripDays), max_trip_duration: String(maxTripDays),
  });
  return `${API_BASE}?${params.toString()}`;
}

// Normalize a grouped_prices response into one observation per departure date.
export function parseGroupedPrices(json) {
  if (!json?.success || !json.data || typeof json.data !== "object") return [];
  return Object.entries(json.data).flatMap(([date, item]) => {
    const price = Number(item?.price);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(price) || price <= 0) return [];
    return [{
      departDate: date,
      returnDate: typeof item.return_at === "string" ? item.return_at.slice(0, 10) : null,
      price: Math.round(price),
      transfers: Number.isFinite(Number(item.transfers)) ? Number(item.transfers) : null,
      returnTransfers: Number.isFinite(Number(item.return_transfers)) ? Number(item.return_transfers) : null,
      airline: typeof item.airline === "string" ? item.airline : null,
      originAirport: item.origin_airport || null,
      destinationAirport: item.destination_airport || null,
    }];
  });
}

export async function fetchGroupedPrices({ token, fetchImpl = fetch, ...query }) {
  if (!token) throw new Error("travelpayouts_token_missing");
  const response = await fetchImpl(groupedPricesUrl(query), { headers: { "X-Access-Token": token, "Accept-Encoding": "gzip, deflate" } });
  if (response.status === 429) throw new Error("travelpayouts_rate_limited");
  if (!response.ok) throw new Error(`travelpayouts_http_${response.status}`);
  return parseGroupedPrices(await response.json());
}

// Two-week windows: window 0 is Jan 1–14, window 25 runs from Dec 17 to Dec 31.
export function biweeklyWindow(date) {
  const value = new Date(`${date}T00:00:00Z`);
  const dayOfYear = Math.floor((value - Date.UTC(value.getUTCFullYear(), 0, 1)) / 86400000);
  return Math.min(25, Math.floor(dayOfYear / 14));
}

function windowBounds(year, index) {
  const start = new Date(Date.UTC(year, 0, 1 + index * 14));
  const end = index === 25 ? new Date(Date.UTC(year, 11, 31)) : new Date(Date.UTC(year, 0, 14 + index * 14));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

// Average and cheapest fare per two-week window, from per-departure-date observations.
export function biweeklyAverages(observations) {
  const groups = new Map();
  for (const item of observations) {
    const year = Number(item.departDate.slice(0, 4));
    const key = `${year}:${biweeklyWindow(item.departDate)}`;
    if (!groups.has(key)) groups.set(key, { year, index: biweeklyWindow(item.departDate), prices: [], nonstop: 0 });
    const group = groups.get(key);
    group.prices.push(item.price);
    if (item.transfers === 0 && (item.returnTransfers ?? 0) === 0) group.nonstop += 1;
  }
  return [...groups.values()].sort((a, b) => a.year - b.year || a.index - b.index).map((group) => ({
    ...windowBounds(group.year, group.index),
    average: Math.round(group.prices.reduce((sum, price) => sum + price, 0) / group.prices.length),
    cheapest: Math.min(...group.prices),
    samples: group.prices.length,
    nonstopShare: Number((group.nonstop / group.prices.length).toFixed(2)),
  }));
}

// The fare window for a departure date. Without a date (flexible travelers), the
// year-round picture: the mean of every window's average and cheapest fare.
export function fareForDate(route, date) {
  if (!route?.windows?.length) return null;
  if (date) return route.windows.find((window) => window.start <= date && date <= window.end) || null;
  const mean = (key) => Math.round(route.windows.reduce((sum, window) => sum + window[key], 0) / route.windows.length);
  return { start: route.windows[0].start, end: route.windows[route.windows.length - 1].end, average: mean("average"), cheapest: mean("cheapest"), samples: route.samples, yearRound: true };
}
