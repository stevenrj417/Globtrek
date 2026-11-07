// Refresh U.S. domestic fares from the U.S. DOT Consumer Airfare Report (no account needed).
// Usage: npm run flights:dot
//
// Source: data.transportation.gov dataset yj5y-b2ir (Table 6: every city-pair market
// averaging at least 10 passengers a day). `fare` is the average one-way fare actually
// paid (taxes and fees included); `fare_low` is the average on the lowest-fare airline.
// Markets are directionless, and the report covers the 48 contiguous states only, so
// Hawaii and Alaska keep the researched fares in travelFeasibility.js.
import { writeFile } from "node:fs/promises";

const ENDPOINT = "https://data.transportation.gov/resource/yj5y-b2ir.json";

// Airport → DOT city market name (exact strings from the dataset).
const CITY = {
  PDX: "Portland, OR", SEA: "Seattle, WA", SFO: "San Francisco, CA (Metropolitan Area)", OAK: "San Francisco, CA (Metropolitan Area)", SJC: "San Francisco, CA (Metropolitan Area)",
  LAX: "Los Angeles, CA (Metropolitan Area)", BUR: "Los Angeles, CA (Metropolitan Area)", SAN: "San Diego, CA", SMF: "Sacramento, CA", LAS: "Las Vegas, NV", PHX: "Phoenix, AZ",
  DEN: "Denver, CO", SLC: "Salt Lake City, UT", DFW: "Dallas/Fort Worth, TX", IAH: "Houston, TX", ORD: "Chicago, IL", MSP: "Minneapolis/St. Paul, MN",
  ATL: "Atlanta, GA (Metropolitan Area)", JFK: "New York City, NY (Metropolitan Area)", EWR: "New York City, NY (Metropolitan Area)", BOS: "Boston, MA (Metropolitan Area)",
  IAD: "Washington, DC (Metropolitan Area)", MIA: "Miami, FL (Metropolitan Area)", PSP: "Palm Springs, CA", AUS: "Austin, TX", MSY: "New Orleans, LA",
  BNA: "Nashville, TN", MCO: "Orlando, FL", SAF: "Santa Fe, NM",
};
const ORIGINS = ["PDX", "SEA", "SFO", "OAK", "SJC", "LAX", "BUR", "SAN", "SMF", "LAS", "PHX", "DEN", "SLC", "DFW", "IAH", "ORD", "MSP", "ATL", "JFK", "EWR", "BOS", "IAD", "MIA"];
const DESTINATIONS = ["LAS", "SAN", "PSP", "LAX", "SFO", "SEA", "ORD", "AUS", "MSY", "BNA", "MIA", "MCO", "SAF", "JFK", "DEN", "PHX", "SLC"];

async function fetchRows(where) {
  const rows = [];
  for (let offset = 0; ; offset += 5000) {
    const params = new URLSearchParams({ $where: where, $limit: "5000", $offset: String(offset), $order: "year DESC, quarter DESC", $select: "year,quarter,city1,city2,fare,fare_low,carrier_low,nsmiles,passengers" });
    const response = await fetch(`${ENDPOINT}?${params}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`dot_http_${response.status}`);
    const page = await response.json();
    rows.push(...page);
    if (page.length < 5000) return rows;
  }
}

const [latest] = await fetchRows("year IS NOT NULL");
if (!latest) throw new Error("dot_empty");
const latestYear = Number(latest.year);
const latestQuarter = Number(latest.quarter);
// The four most recent quarters, so every season of the year is covered.
const recent = Array.from({ length: 4 }, (_, index) => {
  const total = latestYear * 4 + (latestQuarter - 1) - index;
  return { year: Math.floor(total / 4), quarter: (total % 4) + 1 };
});
const names = [...new Set(Object.values(CITY))].map((name) => `'${name.replaceAll("'", "''")}'`).join(",");
const periodWhere = recent.map(({ year, quarter }) => `(year=${year} AND quarter=${quarter})`).join(" OR ");
const rows = await fetchRows(`(${periodWhere}) AND city1 in(${names}) AND city2 in(${names})`);

const byPair = new Map();
for (const row of rows) byPair.set(`${row.city1}|${row.city2}|${row.quarter}`, row);
const lookup = (a, b, quarter) => byPair.get(`${a}|${b}|${quarter}`) || byPair.get(`${b}|${a}|${quarter}`) || null;

const routes = {};
for (const origin of ORIGINS) {
  for (const destination of DESTINATIONS) {
    if (CITY[origin] === CITY[destination]) continue;
    const quarters = {};
    let miles = null;
    for (const { quarter } of recent) {
      const row = lookup(CITY[origin], CITY[destination], String(quarter));
      const fare = Number(row?.fare);
      if (!row || !Number.isFinite(fare) || fare <= 0) continue;
      const fareLow = Number(row.fare_low);
      miles = Number(row.nsmiles) || miles;
      quarters[quarter] = {
        year: Number(row.year),
        fare: Math.round(fare),
        fareLow: Number.isFinite(fareLow) && fareLow > 0 ? Math.round(fareLow) : Math.round(fare),
        carrierLow: row.carrier_low || null,
        passengersPerDay: Math.round(Number(row.passengers) || 0),
      };
    }
    if (Object.keys(quarters).length) routes[`${origin}:${destination}`] = { source: "dot", miles, quarters };
  }
}

const output = {
  source: "U.S. DOT Consumer Airfare Report, Table 6 (data.transportation.gov dataset yj5y-b2ir)",
  sourceUrl: "https://data.transportation.gov/d/yj5y-b2ir",
  currency: "USD",
  checkedAt: new Date().toISOString().slice(0, 10),
  latestPeriod: `${latestYear} Q${latestQuarter}`,
  basis: "Average one-way fare actually paid, taxes and fees included, by quarter; fareLow is the average on the lowest-fare airline",
  routes,
};
await writeFile(new URL("../../app/data/flightPrices.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${Object.keys(routes).length} routes (latest ${output.latestPeriod}) from ${rows.length} DOT rows`);
for (const key of Object.keys(routes).filter((route) => route.startsWith("PDX:")).sort()) {
  console.log(`  ${key}  ${Object.entries(routes[key].quarters).sort().map(([quarter, value]) => `Q${quarter} $${value.fare}/$${value.fareLow}`).join("  ")}`);
}
