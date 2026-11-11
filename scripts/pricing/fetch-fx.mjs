// Euro reference rates from the European Central Bank (free public data, last
// 90 business days), saved as USD-per-unit rates by date for converting
// observed prices on the day they were seen.
// Usage: node scripts/pricing/fetch-fx.mjs   → app/data/pricing/fxRates.json
import { mkdir, writeFile } from "node:fs/promises";

const response = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml");
if (!response.ok) throw new Error(`ecb_http_${response.status}`);
const xml = await response.text();
const days = {};
for (const [, date, body] of xml.matchAll(/<Cube time="(\d{4}-\d{2}-\d{2})">([\s\S]*?)<\/Cube>/g)) {
  const perEuro = { EUR: 1 };
  for (const [, currency, rate] of body.matchAll(/currency="([A-Z]{3})" rate="([\d.]+)"/g)) perEuro[currency] = Number(rate);
  if (!perEuro.USD) continue;
  // USD for one unit of each currency.
  days[date] = Object.fromEntries(Object.entries(perEuro).map(([currency, rate]) => [currency, Number((perEuro.USD / rate).toFixed(6))]));
}
const dates = Object.keys(days).sort();
// Currencies the ECB doesn't publish (VND, ARS, ...): ExchangeRate-API's free
// open-access rates (attribution required), today's rate only.
const open = await fetch("https://open.er-api.com/v6/latest/USD").then((reply) => reply.json());
const fallback = open?.result === "success" ? Object.fromEntries(Object.entries(open.rates).filter(([currency]) => !(currency in days[dates.at(-1)])).map(([currency, perUsd]) => [currency, Number((1 / perUsd).toPrecision(6))])) : {};
const fallbackDate = open?.time_last_update_unix ? new Date(open.time_last_update_unix * 1000).toISOString().slice(0, 10) : null;
await mkdir(new URL("../../app/data/pricing/", import.meta.url), { recursive: true });
await writeFile(new URL("../../app/data/pricing/fxRates.json", import.meta.url), `${JSON.stringify({ source: "European Central Bank euro foreign exchange reference rates", sourceUrl: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html", from: dates[0], to: dates.at(-1), usdPerUnit: days, fallback: { source: "Rates By Exchange Rate API (https://www.exchangerate-api.com)", date: fallbackDate, usdPerUnit: fallback } })}\n`);
console.log(`${Object.keys(fallback).length} fallback currencies; ${dates.length} days, ${dates[0]} to ${dates.at(-1)}, ${Object.keys(days[dates.at(-1)]).length} currencies`);
