// Collect round-trip fare observations through a preview deployment's
// /api/internal/pricing/collect route (the Travelpayouts token lives only on
// Vercel) and append them to data/price-observations/flights.ndjson.gz.
//
// Usage: node scripts/pricing/collect-fares.mjs <preview-url> [ORIGIN,ORIGIN,...]
// Each line is one observation:
//   [origin, destination, observedAt, departDate, returnDate, priceUsd, stops, durationMinutes]
// Re-running the same day adds nothing twice.
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { gunzipSync, gzipSync } from "node:zlib";
import flightPrices from "../../app/data/flightPrices.json" with { type: "json" };

const run = promisify(execFile);
const [deployment, list] = process.argv.slice(2);
if (!deployment?.startsWith("https://")) throw new Error("Pass the preview deployment URL");
const US = [...new Set(Object.keys(flightPrices.routes).map((key) => key.split(":")[0]))];
const WORLD = "LHR LGW MAN DUB CDG AMS FRA MUC MAD BCN FCO MXP ZRH VIE CPH ARN OSL HEL WAW PRG BUD IST DXB DOH DEL BOM SIN BKK HKG ICN NRT HND KIX TPE MNL KUL SYD MEL AKL YYZ YVR YUL YYC MEX GDL CUN BOG LIM SCL EZE GRU JNB CPT CAI NBO".split(" ");
const origins = list ? list.split(",") : [...US, ...WORLD];
const file = new URL("../../data/price-observations/flights.ndjson.gz", import.meta.url);
let existing = [];
try { existing = gunzipSync(await readFile(file)).toString("utf8").split("\n").filter(Boolean); } catch {}
const seen = new Set(existing);
let added = 0;
for (const origin of origins) {
  const { stdout } = await run(`${process.env.HOME}/.local/bin/vercel`, ["curl", `/api/internal/pricing/collect?kind=flights&origin=${origin}&pages=2`, "--deployment", deployment], { maxBuffer: 64 * 1024 * 1024 }).catch((error) => ({ stdout: error.stdout || "{}" }));
  let body = {};
  try { body = JSON.parse(stdout); } catch {}
  let fresh = 0;
  for (const row of body.rows || []) {
    if (row.currency !== "USD") continue;
    const line = JSON.stringify([row.origin, row.destination, row.observedAt, row.travelDate, row.travelEnd, row.price, row.conditions?.stops ?? null, row.conditions?.durationMinutes ?? null]);
    if (seen.has(line)) continue;
    seen.add(line);
    existing.push(line);
    fresh += 1;
  }
  added += fresh;
  console.log(`${origin} ${body.count ?? "failed"} fares, ${fresh} new${body.errors?.length ? ` errors ${JSON.stringify(body.errors)}` : ""}`);
}
await writeFile(file, gzipSync(`${existing.join("\n")}\n`));
console.log(`${added} new observations; ${existing.length} in the store`);
