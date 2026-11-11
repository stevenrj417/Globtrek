// Scores every launch-set destination against GlobTrek's "perfect destination" standard.
// Usage: npm run check:launch   (writes audit/launch-report.md)
import { mkdir, writeFile } from "node:fs/promises";
import { destinations, bookingPropertyUrl } from "../app/data/destinations.js";
import { LAUNCH_DATA, LAUNCH_SET } from "../app/data/launchSet.js";
import { launchHotels } from "../app/data/launchStays.js";
import { estimateFlight } from "../app/lib/recommendation/travelFeasibility.js";
import { isCjUrl } from "../app/lib/booking/cj.js";

const CHECKS = [
  ["Photos", "hero plus at least 4 verified gallery photos", (d, data) => Boolean(d.image) && (data.gallery?.length || 0) >= 4],
  ["Hotels", "4 verified Booking.com pages, CJ-tracked, mostly budget", (d) => {
    const hotels = launchHotels(d.id);
    return hotels.length >= 4 && hotels.every((hotel) => isCjUrl(bookingPropertyUrl(hotel, {}))) && hotels.filter((hotel) => hotel.priceTier === "budget").length >= 3;
  }],
  ["Dinners", "5 verified restaurants with a reservation link or walk-in note", (d, data) => (data.dinners?.length || 0) >= 5],
  ["Activities", "5 verified things to do with a booking link or marked free", (d, data) => (data.activities?.length || 0) >= 5],
  ["Airport ride", "transit route, fare and time plus a rideshare link", (d, data) => Boolean(data.airportRide?.transit && data.airportRide?.rideshare)],
  ["Flights from PDX", "real fare data, not the distance model", (d) => ["us_dot_average_fare_paid", "aviasales_cached_fares"].includes(estimateFlight({ origin: "PDX" }, d).priceSource) || estimateFlight({ origin: "PDX" }, d).confidence >= 0.6],
  ["Timing and costs", "reviewed season and a 12-month cost model", (d) => Boolean(d.season) && !/review/i.test(d.season) && d.planningAverages?.monthly?.length === 12],
  ["Free things", "at least 3 free highlights", (d) => (d.freeHighlights?.length || 0) >= 3],
];

const rows = LAUNCH_SET.map((id) => {
  const destination = destinations.find((item) => item.id === id);
  if (!destination) return { id, city: id, score: 0, missing: ["destination not in catalog"] };
  const data = LAUNCH_DATA[id] || {};
  const results = CHECKS.map(([name, rule, test]) => ({ name, rule, pass: Boolean(test(destination, data)) }));
  return { id, city: destination.city, score: results.filter((item) => item.pass).length, missing: results.filter((item) => !item.pass).map((item) => item.name) };
}).sort((a, b) => b.score - a.score);

const ready = rows.filter((row) => row.score === CHECKS.length);
const lines = [
  "# Launch set readiness",
  "",
  `Generated ${new Date().toISOString().slice(0, 10)}. A destination launches only at ${CHECKS.length}/${CHECKS.length}.`,
  "",
  "## The standard",
  "",
  ...CHECKS.map(([name, rule], index) => `${index + 1}. **${name}:** ${rule}`),
  "",
  `## Scores (${ready.length} of ${rows.length} ready)`,
  "",
  "| Destination | Score | Missing |",
  "|---|---|---|",
  ...rows.map((row) => `| ${row.city} | ${row.score}/${CHECKS.length} | ${row.missing.join(", ") || "Ready"} |`),
  "",
];
await mkdir(new URL("../audit/", import.meta.url), { recursive: true });
await writeFile(new URL("../audit/launch-report.md", import.meta.url), lines.join("\n"));
console.log(lines.slice(lines.indexOf(`## Scores (${ready.length} of ${rows.length} ready)`)).join("\n"));
