import { readFileSync } from "node:fs";
import { join } from "node:path";

// The bundled Booking.com catalog snapshot, one file per destination
// (app/data/feedStays/, written from feedStays.json by
// scripts/catalog/split-feed-stays.mjs before each build). Each file is read
// the first time it is needed, so a cold server never loads the whole catalog.
const DIR = join(process.cwd(), "app/data/feedStays");
const cache = new Map();

function read(name, fallback) {
  if (cache.has(name)) return cache.get(name);
  let value = fallback;
  try { value = JSON.parse(readFileSync(join(DIR, `${name}.json`), "utf8")); } catch {}
  cache.set(name, value);
  return value;
}

export function feedStaysFor(destinationId) {
  const id = String(destinationId || "");
  return /^[A-Za-z0-9_-]+$/.test(id) ? read(id, []) : [];
}

export const feedCheckedAt = () => read("_meta", {}).checkedAt || null;

// The destination whose file holds this Booking.com property, or null.
export const feedDestinationOf = (propertyId) => read("_ids", {})[String(propertyId)] || null;
