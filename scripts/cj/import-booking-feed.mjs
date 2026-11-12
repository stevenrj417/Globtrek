// Import Booking.com property listings from GlobTrek's CJ product feeds.
//
// Usage:
//   npm run stays:import -- --dry-run            fetch and report, write nothing
//   npm run stays:import -- --snapshot           refresh app/data/feedStays.json (bundled fallback)
//   npm run stays:import -- --supabase           upsert into Supabase (needs SUPABASE_SERVICE_ROLE_KEY)
//   add --destinations HAN,LIS to limit the run, or --all to include destinations that aren't ready yet
//
// Credentials (CJ_API_TOKEN, CJ_COMPANY_ID, CJ_PID, and for --supabase
// NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are read from the
// environment or .env.local. Nothing secret is printed.
import { readFile, writeFile } from "node:fs/promises";

async function loadEnvFile() {
  try {
    const text = await readFile(new URL("../../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?\s*$/);
      if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
    }
  } catch {}
}
await loadEnvFile();

const { createCjClient } = await import("../../app/lib/catalog/cjClient.js");
const { runImport } = await import("../../app/lib/catalog/cjBookingImporter.js");
const { SnapshotCatalogStore, SupabaseCatalogStore } = await import("../../app/lib/catalog/catalogStore.js");
const { catalogDestinations } = await import("../../app/lib/catalog/catalogDestinations.js");
const { stayCounts } = await import("../../app/lib/catalog/stayCounts.js");

const args = process.argv.slice(2);
const mode = args.includes("--supabase") ? "supabase" : args.includes("--snapshot") ? "snapshot" : "dry-run";
const only = args.includes("--destinations") ? args[args.indexOf("--destinations") + 1].split(",").map((id) => id.trim()) : null;
// --all also covers catalog destinations not yet recommendation-ready, to see which can be completed.
const pool = args.includes("--all") ? catalogDestinations({ all: true }) : catalogDestinations();
const destinations = pool.filter((destination) => !only || only.includes(destination.id));
const snapshotUrl = new URL("../../app/data/feedStays.json", import.meta.url);

let store = null;
if (mode === "snapshot") {
  let previous = null;
  try { previous = JSON.parse(await readFile(snapshotUrl, "utf8")); } catch {}
  store = new SnapshotCatalogStore(previous, { compact: args.includes("--compact") });
} else if (mode === "supabase") {
  const { createClient } = await import("@supabase/supabase-js");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to import into Supabase.");
    process.exit(1);
  }
  store = new SupabaseCatalogStore(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }));
}

const client = createCjClient();
const log = (entry) => console.log(`${String(entry.destination).padEnd(24)} ${entry.status || "failed"}  ${entry.records ?? 0} stays${entry.error ? `  ${entry.error}` : ""}`);
// --size N keeps up to N properties per destination (default 60).
const size = args.includes("--size") ? Math.max(6, Number(args[args.indexOf("--size") + 1]) || 60) : undefined;
const run = await runImport({ client, destinations, store, dryRun: mode === "dry-run", trigger: "script", logger: log, ...(size ? { size } : {}) });
if (mode === "snapshot" && run.destinationsSucceeded) {
  await writeFile(snapshotUrl, `${JSON.stringify(store.snapshot)}\n`);
  await writeFile(new URL("../../app/data/feedStayCounts.json", import.meta.url), `${JSON.stringify(stayCounts(store.snapshot))}\n`);
}
console.log(JSON.stringify({ mode, status: run.status, destinations: `${run.destinationsSucceeded}/${run.destinationsAttempted}`, records: run.recordsSeen, saved: run.recordsSaved, deactivated: run.recordsDeactivated, requests: run.requests, errors: run.errors }, null, 1));
process.exit(run.status === "failed" ? 1 : 0);
