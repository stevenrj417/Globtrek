// Prints which destinations the quiz may recommend and what the rest are missing.
// Usage: node scripts/catalog/readiness-report.mjs [--all]
import { destinations } from "../../app/data/destinations.js";
import { destinationReadiness } from "../../app/lib/recommendation/eligibility.js";

const showAll = process.argv.includes("--all");
const rows = destinations.map((destination) => ({ destination, ...destinationReadiness(destination) }));
const eligible = rows.filter((row) => row.eligible);
for (const row of rows) {
  if (!showAll && !row.eligible && row.destination.catalogStatus === "verified_destination_only") continue;
  console.log(`${row.eligible ? "ELIGIBLE " : "excluded "} ${row.destination.id.padEnd(26)} ${row.destination.city}${row.eligible ? "" : `  missing: ${row.missing.join(", ")}`}`);
}
const settings = ["Ocean", "Mountains", "Cities", "Culture"];
console.log(`\n${eligible.length} eligible of ${rows.length}.`, settings.map((tag) => `${tag}: ${eligible.filter((row) => row.destination.tags.includes(tag)).length}`).join("  "));
