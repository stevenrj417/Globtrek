// Country price levels (USA = 1) from the World Bank (CC BY 4.0): PPP
// conversion factor (PA.NUS.PPP) divided by the market exchange rate
// (PA.NUS.FCRF), latest year with both.
// Usage: node scripts/pricing/fetch-price-levels.mjs → app/data/pricing/priceLevels.json
import { writeFile } from "node:fs/promises";

async function indicator(id) {
  const reply = await fetch(`https://api.worldbank.org/v2/country/all/indicator/${id}?format=json&per_page=20000&date=2019:2025`, { signal: AbortSignal.timeout(120000) });
  const [, rows] = await reply.json();
  const byYear = {};
  for (const row of rows || []) if (row.value != null) (byYear[row.country.id] ||= {})[row.date] = row.value;
  return byYear;
}
const [ppp, fx] = await Promise.all([indicator("PA.NUS.PPP"), indicator("PA.NUS.FCRF")]);
const countries = {};
for (const [code, years] of Object.entries(ppp)) {
  if (!/^[A-Z]{2}$/.test(code) || !fx[code]) continue;
  // The latest year both indicators report.
  const year = Object.keys(years).filter((value) => fx[code][value]).sort().at(-1);
  if (year) countries[code] = { level: Number((years[year] / fx[code][year]).toFixed(4)), year: Number(year) };
}
await writeFile(new URL("../../app/data/pricing/priceLevels.json", import.meta.url), `${JSON.stringify({ source: "World Bank World Development Indicators (CC BY 4.0): PA.NUS.PPP / PA.NUS.FCRF", checkedAt: new Date().toISOString().slice(0, 10), countries })}\n`);
console.log(Object.keys(countries).length, "countries; PT", countries.PT, "VN", countries.VN);
