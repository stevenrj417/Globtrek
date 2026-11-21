// Reads saved picks for a place + budget, or builds them. Saved rows hold only
// Google place IDs, distances we computed, and Booking.com listing data from CJ
// (no Google names, ratings or photos). Picks refresh every REFRESH_DAYS: a stale
// row is still shown while a fresh one is built in the background.

import { createCjClient } from "../catalog/cjClient.js";
import { createAdminClient } from "../supabase/admin.js";
import { createPlacesClient, PICK_FIELDS } from "./google.js";
import { BUDGET_KEYS } from "./rank.js";
import { PICKS_VERSION, REFRESH_DAYS, computePicks } from "./picks.js";

const log = (entry) => console.log(JSON.stringify({ level: "info", ...entry }));
const inflight = globalThis.__globtrekAnyplaceInflight || new Map();
globalThis.__globtrekAnyplaceInflight = inflight;

function store() {
  try { return createAdminClient(); } catch { return null; }
}

async function readSaved(db, placeId, budget) {
  if (!db) return null;
  const { data, error } = await db.from("place_picks").select("picks, refresh_after").eq("place_id", placeId).eq("budget", budget).maybeSingle();
  if (error || !data?.picks || data.picks.v !== PICKS_VERSION) return null;
  return { picks: data.picks, stale: Date.parse(data.refresh_after) < Date.now() };
}

async function save(db, placeId, all) {
  if (!db) return;
  const now = new Date();
  const refresh = new Date(now.getTime() + REFRESH_DAYS * 86400000);
  const rows = BUDGET_KEYS.map((budget) => ({ place_id: placeId, budget, picks: all[budget], computed_at: now.toISOString(), refresh_after: refresh.toISOString() }));
  const { error } = await db.from("place_picks").upsert(rows, { onConflict: "place_id,budget" });
  if (error) log({ msg: "anyplace_save_failed", error: error.message });
}

// One build per place at a time, however many visitors arrive together.
function build(destination) {
  const running = inflight.get(destination.placeId);
  if (running) return running;
  const job = (async () => {
    const all = await computePicks({ places: createPlacesClient(), cj: createCjClient({ minIntervalMs: 250, timeoutMs: 15000, maxAttempts: 2 }), destination, log });
    await save(store(), destination.placeId, all);
    return all;
  })().finally(() => inflight.delete(destination.placeId));
  inflight.set(destination.placeId, job);
  return job;
}

// → { picks, fresh } where fresh is false when a stale row was served.
export async function getPicks(destination, budget, { background = (task) => task.catch(() => {}) } = {}) {
  const db = store();
  const saved = await readSaved(db, destination.placeId, budget).catch(() => null);
  if (saved && !saved.stale) return { picks: saved.picks, fresh: true };
  if (saved) { background(build(destination)); return { picks: saved.picks, fresh: false }; }
  const all = await build(destination);
  return { picks: all[budget], fresh: true };
}

// Fresh Google details for the dinners and things to do being shown. Places
// that have closed since the picks were saved are left out.
export async function hydrate(picks, places = createPlacesClient()) {
  const fetchOne = async (item) => {
    try {
      const place = await places.details(item.id, PICK_FIELDS);
      if (!place || (place.businessStatus && place.businessStatus !== "OPERATIONAL")) return null;
      return { ...item, name: place.displayName?.text || "", type: place.primaryTypeDisplayName?.text || null, rating: Number(place.rating) || null, reviews: Number(place.userRatingCount) || null, priceLevel: place.priceLevel || null, mapsUrl: place.googleMapsUri || null };
    } catch { return null; }
  };
  const [dinners, activities] = await Promise.all([Promise.all(picks.dinners.map(fetchOne)), Promise.all(picks.activities.map(fetchOne))]);
  return { ...picks, dinners: dinners.filter((item) => item?.name), activities: activities.filter((item) => item?.name) };
}
