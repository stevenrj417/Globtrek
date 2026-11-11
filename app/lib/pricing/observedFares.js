// Server only: observed round-trip fares for a route and travel period, from
// the fare index (app/data/pricing/fareIndex.json, built from fares Aviasales
// travelers found). Imported by API routes, never by browser code: the index
// is about 1 MB.
//
// Route matching tries the exact airports first, then the metro city code on
// either end (fares filed under "NYC" or "PAR"), and says when it used one.

import fareIndex from "../../data/pricing/fareIndex.json" with { type: "json" };
import cityCodes from "../../data/pricing/cityCodes.json" with { type: "json" };

import { createAdminClient } from "../supabase/admin.js";

const CITY_OF = {};
for (const [city, airports] of Object.entries(cityCodes.cities)) for (const airport of airports) CITY_OF[airport] ||= city;
const pad = (month) => String(month).padStart(2, "0");
const DAY = 86400000;

function routeCandidates(origin, destination) {
  const from = [origin, CITY_OF[origin]].filter(Boolean);
  const to = [destination, CITY_OF[destination]].filter(Boolean);
  return from.flatMap((a) => to.map((b) => ({ key: `${a}-${b}`, metroOrigin: a !== origin ? a : null, metroDestination: b !== destination ? b : null })));
}

// Averages from the live observation store (public.price_period_stats), per
// origin, loaded before ranking and kept for six hours. They take precedence
// over the committed index because they include the latest daily collections.
const live = new Map();
const LIVE_TTL = 6 * 60 * 60 * 1000;

export async function prefetchObservedFares(origin, { timeoutMs = 1200 } = {}) {
  const code = String(origin || "").toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return;
  const cached = live.get(code);
  if (cached && Date.now() - cached.at < LIVE_TTL) return;
  live.set(code, { at: Date.now(), routes: cached?.routes || {} });
  try {
    const supabase = createAdminClient();
    const prefixes = [code, CITY_OF[code]].filter(Boolean);
    const query = supabase.from("price_period_stats").select("item_id,period,samples,average,median,low,high,observed_from,observed_to").eq("kind", "flight").eq("currency", "USD").or(prefixes.map((prefix) => `item_id.like.${prefix}-%`).join(",")).limit(20000);
    const { data, error } = await Promise.race([query, new Promise((resolve) => setTimeout(() => resolve({ error: { code: "timeout" } }), timeoutMs))]);
    if (error || !Array.isArray(data)) return;
    const routes = {};
    for (const row of data) (routes[row.item_id] ||= {})[row.period] = [Number(row.average), Number(row.median), Number(row.low), Number(row.high), Number(row.samples), row.observed_from, row.observed_to];
    live.set(code, { at: Date.now(), routes });
  } catch {
    // No store configured or reachable: the committed index still answers.
  }
}

function periodsFor(key) {
  const origin = key.split("-")[0];
  for (const cached of [live.get(origin), ...Object.entries(CITY_OF).filter(([airport, city]) => city === origin).map(([airport]) => live.get(airport))]) {
    if (cached?.routes?.[key]) return { ...fareIndex.routes[key], ...cached.routes[key] };
  }
  return fareIndex.routes[key];
}

function entry(route, key, basis, period, now) {
  const [averageUsd, medianUsd, lowUsd, highUsd, samples, observedFrom, observedTo] = periodsFor(route.key)[key];
  const newestAgeDays = Math.round((now - Date.parse(`${observedTo}T00:00:00Z`)) / DAY);
  return { route: route.key, metroOrigin: route.metroOrigin, metroDestination: route.metroDestination, basis, period, averageUsd, medianUsd, lowUsd, highUsd, samples, observedFrom, observedTo, stale: newestAgeDays > 45, nonstopSeen: Boolean(fareIndex.routes[route.key]?.nonstop) };
}

// departDate: an exact departure; months: candidate travel months (1-12) for
// flexible trips, cheapest first is picked. Returns null when nothing observed.
export function observedFare({ origin, destination, departDate = null, months = [], now = Date.now() }) {
  if (!origin || !destination) return null;
  for (const route of routeCandidates(String(origin).toUpperCase(), String(destination).toUpperCase())) {
    const periods = periodsFor(route.key);
    if (!periods) continue;
    if (departDate) {
      const month = departDate.slice(5, 7);
      const half = `${month}${Number(departDate.slice(8, 10)) <= 15 ? "a" : "b"}`;
      if (periods[half]) return entry(route, half, "observed_biweekly", half, now);
      if (periods[month]) return entry(route, month, "observed_monthly", month, now);
      continue;
    }
    const wanted = (months.length ? months : Array.from({ length: 12 }, (_, index) => index + 1)).map(pad).filter((month) => periods[month]);
    if (!wanted.length) continue;
    const cheapest = wanted.sort((a, b) => periods[a][1] - periods[b][1])[0];
    return { ...entry(route, cheapest, "observed_monthly", cheapest, now), cheapestOfMonths: !months.length };
  }
  return null;
}

export const FARE_INDEX_RANGE = { from: fareIndex.observedFrom, to: fareIndex.observedTo, observations: fareIndex.observations };
