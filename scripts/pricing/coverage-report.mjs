// What the pricing data covers, per destination: whether it may be recommended
// (and what's missing if not), how many origins have observed fares to it and
// for which travel months, and where each cost line comes from.
//   node scripts/pricing/coverage-report.mjs [--json path]
import { writeFile } from "node:fs/promises";

const { destinations } = await import("../../app/data/destinations.js");
const { destinationReadiness } = await import("../../app/lib/recommendation/eligibility.js");
const { default: fareIndex } = await import("../../app/data/pricing/fareIndex.json", { with: { type: "json" } });
const { default: cityCodes } = await import("../../app/data/pricing/cityCodes.json", { with: { type: "json" } });
const { default: activityIndex } = await import("../../app/data/pricing/activityIndex.json", { with: { type: "json" } });
const { default: stayCounts } = await import("../../app/data/feedStayCounts.json", { with: { type: "json" } });
const { LAUNCH_SET } = await import("../../app/data/launchSet.js");

// Airport -> its metro code, so PAR fares count for CDG.
const metroOf = {};
for (const [metro, airports] of Object.entries(cityCodes.cities)) for (const airport of airports) metroOf[airport] = metro;
const faresTo = {};
for (const [key, periods] of Object.entries(fareIndex.routes)) {
  const destination = key.split("-")[1];
  const entry = (faresTo[destination] ||= { origins: new Set(), months: new Set() });
  entry.origins.add(key.split("-")[0]);
  for (const period of Object.keys(periods)) if (/^\d{2}$/.test(period)) entry.months.add(Number(period));
}

const rows = destinations.map((destination) => {
  const readiness = destinationReadiness(destination);
  const fares = [faresTo[destination.airport], faresTo[metroOf[destination.airport]]].filter(Boolean);
  const months = [...new Set(fares.flatMap((entry) => [...entry.months]))].sort((a, b) => a - b);
  return {
    id: destination.id,
    city: destination.city,
    country: destination.country,
    type: destination.destinationType || null,
    eligible: readiness.eligible,
    missing: readiness.missing,
    fareOrigins: new Set(fares.flatMap((entry) => [...entry.origins])).size,
    fareMonths: months,
    costModel: destination.planningAverages?.model || null,
    lodgingBasis: LAUNCH_SET.includes(destination.id) ? "observed hostel prices (launch set)" : destination.planningAverages?.model === "local_prices" ? "modeled (local prices)" : destination.planningAverages?.model === "city" ? "editorial city costs" : "tier model",
    dormProperties: stayCounts.dorms?.[destination.id] || 0,
    activityProducts: activityIndex.destinations?.[destination.id]?.products || 0,
  };
});

const eligible = rows.filter((row) => row.eligible);
const reasons = {};
for (const row of rows) for (const reason of row.missing) reasons[reason] = (reasons[reason] || 0) + 1;
const onlyReason = {};
for (const row of rows) if (row.missing.length === 1) onlyReason[row.missing[0]] = (onlyReason[row.missing[0]] || 0) + 1;
console.log(`${rows.length} destinations, ${eligible.length} eligible`);
console.log("missing (any):", reasons);
console.log("missing (only reason):", onlyReason);
console.log(`eligible with observed fares from at least one origin: ${eligible.filter((row) => row.fareOrigins).length}`);
console.log(`eligible with observed fares in 6+ travel months: ${eligible.filter((row) => row.fareMonths.length >= 6).length}`);
console.log("eligible by cost model:", eligible.reduce((counts, row) => ({ ...counts, [row.costModel]: (counts[row.costModel] || 0) + 1 }), {}));
const out = process.argv.includes("--json") ? process.argv[process.argv.indexOf("--json") + 1] : null;
if (out) await writeFile(out, `${JSON.stringify({ generatedAt: new Date().toISOString(), fareObservations: { from: fareIndex.observedFrom, to: fareIndex.observedTo, count: fareIndex.observations }, rows }, null, 1)}\n`);
