// Validates destination data and reports which destinations are publishable.
// Usage: npm run check:data [-- --out audit/data-report.md]
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { destinations } from "../app/data/destinations.js";
import { completeness, publishedDestinations, slugFor } from "../app/data/destinationCatalog.js";
import { estimateTrip } from "../app/lib/recommendation/tripEstimate.js";

const outIndex = process.argv.indexOf("--out");
const outPath = outIndex > -1 ? process.argv[outIndex + 1] : null;

// Structural checks: wrong data is worse than missing data, so these fail the run.
function schemaErrors(d) {
  const errors = [];
  if (typeof d.id !== "string" || !d.id) errors.push("id must be a non-empty string");
  if (d.recognition != null && !(d.recognition >= 0 && d.recognition <= 100)) errors.push("recognition must be 0–100");
  if (d.image && !/^(https:\/\/|\/)/.test(d.image)) errors.push("image must be https or a local path");
  const cost = d.costProfile;
  if (cost) {
    for (const key of ["typicalHotelNight", "foodDaily", "activitiesDaily", "transportDaily"]) {
      const low = cost[`${key}Low`];
      const high = cost[`${key}High`];
      if (low != null && high != null && Number(low) > Number(high)) errors.push(`costProfile.${key}Low > High`);
    }
  }
  for (const month of d.planningAverages?.monthly || []) {
    for (const key of ["hotelNight", "foodPerPersonDay", "activitiesPerPersonDay", "localTransportDay"]) {
      if (!(Number(month[key]) > 0)) errors.push(`planningAverages month ${month.month} ${key} must be > 0`);
    }
  }
  if (d.planningAverages) {
    const estimate = estimateTrip(d, { nights: 5, travelers: 2 });
    const low = estimate.breakdown.reduce((sum, item) => sum + item.low, 0);
    const high = estimate.breakdown.reduce((sum, item) => sum + item.high, 0);
    if (low !== estimate.low || high !== estimate.high) errors.push("estimate breakdown does not add up");
  }
  return errors;
}

const rows = destinations.map((d) => ({ d, ...completeness(d), errors: schemaErrors(d) }));
const slugs = new Map();
for (const item of publishedDestinations) {
  if (slugs.has(item.slug)) rows.find((row) => row.d.id === item.id).errors.push(`duplicate slug "${item.slug}"`);
  slugs.set(item.slug, item.id);
}

const gaps = {};
for (const row of rows) for (const field of row.missing) gaps[field] = (gaps[field] || 0) + 1;
const broken = rows.filter((row) => row.errors.length);

const lines = [
  "# Destination data report",
  "",
  `Generated ${new Date().toISOString().slice(0, 10)}. Threshold: every required field present (see DECISIONS.md).`,
  "",
  `- Destinations in catalog: ${rows.length}`,
  `- Published (indexable pages): ${publishedDestinations.length}`,
  `- Unpublished (noindex, unlisted): ${rows.length - publishedDestinations.length}`,
  `- Structural errors: ${broken.length}`,
  "",
  "## Most common gaps",
  "",
  ...Object.entries(gaps).sort((a, b) => b[1] - a[1]).map(([field, count]) => `- ${field}: ${count}`),
  "",
  "## Published",
  "",
  ...publishedDestinations.map((item) => `- ${item.name} (${item.slug}) · ${item.costModel} cost model`),
  "",
  "## Structural errors",
  "",
  ...(broken.length ? broken.map((row) => `- ${row.d.city} (${row.d.id}): ${row.errors.join("; ")}`) : ["None."]),
  "",
  "## Unpublished and what they're missing",
  "",
  ...rows.filter((row) => !row.publishable).map((row) => `- ${row.d.city ? slugFor(row.d) : row.d.id}: ${row.missing.join(", ")}`),
  "",
];

const report = lines.join("\n");
if (outPath) {
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, report);
  console.log(`Report written to ${outPath}`);
}
console.log(lines.slice(0, 16 + Object.keys(gaps).length).join("\n"));
if (broken.length) {
  console.error(`\n${broken.length} destination(s) have structural errors.`);
  process.exitCode = 1;
}
