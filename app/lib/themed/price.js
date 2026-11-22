// Prices a themed trip, a 7 Wonders trip or a round-the-world trip with
// GlobTrek's own engines, from the traveler's airport and for their dates:
//
//   stays, food, things to do, getting around  budgetEngine, per stop
//   flights                                    estimateFlight, per leg
//   entry tickets and passes                   EXTRAS (published prices)
//   expedition ships and guided tours          PACKAGES (operators' fares)
//
// Every line keeps its basis, so the page can say exactly what it's built on.
// Nothing here is a live quote.

import { destinations } from "../../data/destinations.js";
import { EXTRAS, PACKAGES, CONTINENT_STOPS, SEVEN_WONDERS, THEMED_PHOTOS } from "../../data/themedTrips.js";
import { normalizeTravelerProfile } from "../recommendation/travelerProfile.js";
import { buildBudgetPlan } from "../recommendation/budgetEngine.js";
import { estimateFlight } from "../recommendation/travelFeasibility.js";
import { usdRate } from "../pricing/aggregate.js";

const byId = new Map(destinations.map((item) => [item.id, item]));
export const destinationFor = (id) => byId.get(id) || null;

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86400000;
export const addDays = (iso, days) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
const STYLES = new Set(["cheapest", "value", "comfortable"]);
// The engine plans one stay of up to 28 nights; longer stays are priced in blocks.
const BLOCK_NIGHTS = 28;
// A one-way ticket usually costs more than half a round trip; GlobTrek prices
// each leg of a multi-stop trip at 60% of that route's round-trip estimate.
export const ONE_WAY_SHARE = 0.6;
const STAY_KEYS = ["hotel", "food", "activities", "transportation", "miscBuffer"];

export function cleanOptions({ origin, travelers, start, style } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const startDate = ISO.test(start || "") && start > today ? start : addDays(today, 60);
  return {
    origin: /^[A-Za-z]{3}$/.test(origin || "") ? origin.toUpperCase() : "JFK",
    travelers: Math.min(8, Math.max(1, Math.round(Number(travelers) || 1))),
    start: startDate,
    style: STYLES.has(style) ? style : "value",
  };
}

const sum = (rows, key) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
const round = (value) => Math.round(Number(value) || 0);

function profileFor({ origin, travelers, style }, start, nights) {
  return normalizeTravelerProfile({ answers: {}, spendStyle: style, tripStart: start, tripEnd: addDays(start, nights), isFlexible: false, originAirport: origin, guestCount: String(travelers), adults: travelers, children: 0 });
}

// One stop's stay, food, things to do and local transport, for its own dates.
function priceStop(destination, options, start, nights) {
  const parts = [];
  let left = nights;
  let cursor = start;
  while (left > 0) {
    const block = Math.min(BLOCK_NIGHTS, left);
    parts.push(buildBudgetPlan(profileFor(options, cursor, block), destination));
    cursor = addDays(cursor, block);
    left -= block;
  }
  const line = (key, field = "average") => round(parts.reduce((total, plan) => total + (Number(plan.estimates?.[key]?.[field]) || 0), 0));
  const costs = Object.fromEntries(STAY_KEYS.map((key) => [key, line(key)]));
  const low = round(STAY_KEYS.reduce((total, key) => total + line(key, "low"), 0)) || round(sum([costs], "hotel"));
  const high = round(STAY_KEYS.reduce((total, key) => total + line(key, "high"), 0));
  const first = parts[0];
  const lodging = first?.lodging || null;
  return {
    kind: "stay",
    id: destination.id,
    city: destination.city,
    country: destination.country,
    airport: destination.airport,
    image: destination.image || null,
    start,
    end: addDays(start, nights),
    nights,
    costs,
    total: STAY_KEYS.reduce((total, key) => total + costs[key], 0),
    low: Math.min(low || Infinity, STAY_KEYS.reduce((total, key) => total + costs[key], 0)),
    high: Math.max(high, STAY_KEYS.reduce((total, key) => total + costs[key], 0)),
    lodging: lodging ? { unit: lodging.unit, units: lodging.units, perUnit: lodging.perUnit, type: lodging.type } : null,
    basis: first?.cityPlanningAverage?.basis || first?.budgetBasis || null,
    spendStyle: first?.spendStyle || options.style,
  };
}

function pricePackage(key, options, start) {
  const item = PACKAGES[key];
  const people = options.travelers;
  return {
    kind: "package",
    id: key,
    city: item.city,
    country: item.country,
    airport: item.airport,
    image: THEMED_PHOTOS[key === "mauritania" ? "chinguetti" : key]?.url || null,
    start,
    end: addDays(start, item.nights),
    nights: item.nights,
    label: item.label,
    includes: item.includes,
    note: item.note,
    sources: item.sources,
    perPerson: item.perPerson,
    total: item.perPerson.typical * people,
    low: item.perPerson.low * people,
    high: item.perPerson.high * people,
    inSeason: item.seasonMonths.includes(Number(start.slice(5, 7))),
    seasonMonths: item.seasonMonths,
  };
}

// A flight between two airports for the group, priced for its date.
function priceLeg(from, to, date, options, { roundTrip = false } = {}) {
  if (!from || !to || from === to) return { from, to, date, mode: "ground", perPerson: 0, total: 0, low: 0, high: 0 };
  const profile = { ...profileFor({ ...options, origin: from }, date, 3), origin: from };
  const fare = estimateFlight(profile, { airport: to });
  const share = roundTrip ? 1 : ONE_WAY_SHARE;
  const perPerson = round(fare.average * share);
  return {
    from, to, date, mode: "flight", roundTrip,
    perPerson,
    total: perPerson * options.travelers,
    low: round(fare.low * share) * options.travelers,
    high: round(fare.high * share) * options.travelers,
    source: fare.priceSource,
    basis: roundTrip ? fare.basis : `${Math.round(ONE_WAY_SHARE * 100)}% of the round-trip estimate for this route. ${fare.basis || ""}`.trim(),
  };
}

export function priceExtra(key, options) {
  const item = EXTRAS[key];
  if (!item) return null;
  const rate = usdRate(item.currency, options.start) || (item.currency === "USD" ? 1 : null);
  if (!rate) return null;
  const perPerson = round(item.amount * rate);
  return {
    key, label: item.label, note: item.note, source: item.source,
    local: item.currency === "USD" ? null : `${item.amount.toLocaleString("en-US")} ${item.currency}`,
    perPerson,
    total: perPerson * options.travelers,
    low: round((item.low ?? item.amount) * rate) * options.travelers,
    high: round((item.high ?? item.amount) * rate) * options.travelers,
  };
}

// stops: [{ id, nights } | { package }]; extras: keys of EXTRAS.
export function priceRoute({ stops, extras = [], notPriced = [] }, rawOptions = {}) {
  const options = cleanOptions(rawOptions);
  const priced = [];
  let cursor = options.start;
  for (const stop of stops) {
    if (stop.package) {
      const item = pricePackage(stop.package, options, cursor);
      priced.push(item);
      cursor = item.end;
      continue;
    }
    const destination = destinationFor(stop.id);
    if (!destination || !(stop.nights > 0)) continue;
    const item = priceStop(destination, options, cursor, stop.nights);
    priced.push(item);
    cursor = item.end;
  }
  if (!priced.length) return null;
  const airports = [options.origin, ...priced.map((item) => item.airport)];
  const oneStop = new Set(priced.map((item) => item.airport)).size === 1;
  const legs = oneStop
    ? [priceLeg(options.origin, priced[0].airport, options.start, options, { roundTrip: true })]
    : [...priced.map((item, index) => priceLeg(airports[index], item.airport, item.start, options)), priceLeg(priced.at(-1).airport, options.origin, cursor, options)];
  const extraRows = extras.map((key) => priceExtra(key, options)).filter(Boolean);
  const stays = priced.filter((item) => item.kind === "stay");
  const packages = priced.filter((item) => item.kind === "package");
  const totals = {
    flights: sum(legs, "total"),
    hotel: stays.reduce((total, item) => total + item.costs.hotel, 0),
    food: stays.reduce((total, item) => total + item.costs.food, 0),
    activities: stays.reduce((total, item) => total + item.costs.activities, 0),
    transportation: stays.reduce((total, item) => total + item.costs.transportation, 0),
    buffer: stays.reduce((total, item) => total + item.costs.miscBuffer, 0),
    extras: sum(extraRows, "total"),
    packages: sum(packages, "total"),
  };
  const total = Object.values(totals).reduce((all, value) => all + value, 0);
  const low = sum(legs, "low") + sum(stays, "low") + sum(packages, "low") + sum(extraRows, "low");
  const high = sum(legs, "high") + sum(stays, "high") + sum(packages, "high") + sum(extraRows, "high");
  return {
    options,
    start: options.start,
    end: cursor,
    nights: priced.reduce((all, item) => all + item.nights, 0),
    stops: priced,
    legs,
    extras: extraRows,
    notPriced,
    totals,
    total,
    low: Math.min(low, total),
    high: Math.max(high, total),
    perPerson: Math.round(total / options.travelers),
  };
}

// Each of the New Seven Wonders on its own, and all seven in one trip.
export function priceWonder(slug, options) {
  const wonder = SEVEN_WONDERS.find((item) => item.slug === slug);
  return wonder ? priceRoute({ stops: [{ id: wonder.id, nights: wonder.nights }], extras: [wonder.extra] }, options) : null;
}

export function priceAllWonders(options) {
  return priceRoute({ stops: SEVEN_WONDERS.map((item) => ({ id: item.id, nights: item.nights })), extras: SEVEN_WONDERS.map((item) => item.extra), notPriced: ["The train between Cusco and Aguas Calientes for Machu Picchu: check PeruRail or Inca Rail for your date.", "Visas: India, China and Jordan need one for most passports (the Jordan Pass covers Jordan's)."] }, options);
}

// All seven continents in `months` months: more stops per continent as the
// trip gets longer, Antarctica by expedition ship from Ushuaia.
export const MIN_MONTHS = 1;
export const MAX_MONTHS = 12;
export function planSevenContinents(months, rawOptions = {}) {
  const span = Math.min(MAX_MONTHS, Math.max(MIN_MONTHS, Math.round(Number(months) || 3)));
  const totalNights = Math.round(span * 30.4);
  const antarctic = PACKAGES.antarctica.nights + 1;
  const landNights = Math.max(18, totalNights - antarctic);
  const land = CONTINENT_STOPS.filter((item) => item.stops);
  const perContinent = Math.min(5, Math.max(1, Math.round(landNights / land.length / 9)));
  const picks = land.flatMap((item) => item.stops.slice(0, perContinent).map((id) => ({ id, continent: item.continent }))).filter((item) => destinationFor(item.id));
  const base = Math.floor(landNights / picks.length);
  let spare = landNights - base * picks.length;
  const stops = picks.map((item) => ({ ...item, nights: base + (spare-- > 0 ? 1 : 0) }));
  stops.push({ id: "ushuaia-354bf", nights: 1, continent: "South America" }, { package: "antarctica", continent: "Antarctica" });
  const route = priceRoute({ stops, notPriced: ["Visas and travel insurance (insurance is required on Antarctic ships).", "Trains, ferries and day tours beyond the daily things-to-do budget."] }, rawOptions);
  if (!route) return null;
  const continents = stops.map((item) => item.continent);
  route.stops.forEach((stop, index) => { stop.continent = continents[index]; });
  const antarcticStop = route.stops.find((stop) => stop.kind === "package");
  // When the ship would sail out of season, say which start month lines it up.
  let suggestedStart = null;
  if (antarcticStop && !antarcticStop.inSeason) {
    const offset = Math.round((Date.parse(`${antarcticStop.start}T00:00:00Z`) - Date.parse(`${route.start}T00:00:00Z`)) / DAY);
    for (let shift = 1; shift <= 12; shift += 1) {
      const startMonth = new Date(Date.parse(`${route.start}T00:00:00Z`));
      startMonth.setUTCMonth(startMonth.getUTCMonth() + shift, 1);
      const sail = new Date(startMonth.getTime() + offset * DAY);
      if (PACKAGES.antarctica.seasonMonths.includes(sail.getUTCMonth() + 1)) { suggestedStart = startMonth.toISOString().slice(0, 10); break; }
    }
  }
  return { ...route, months: span, suggestedStart };
}
