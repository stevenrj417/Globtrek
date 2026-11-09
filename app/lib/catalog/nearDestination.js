// Keeps catalog stays that are actually at the destination. Feed records are
// matched by city name, and names repeat (Las Vegas NV and NM, Hollywood CA and
// FL, Austin TX and MN), so every record with coordinates must also be close to
// the destination: within NEAR_KM of its center, or, for a destination without
// coordinates (often a region such as a ring road), within REGION_KM of the
// records' own median point.

export const NEAR_KM = 60;
export const REGION_KM = 300;

export function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const h = Math.sin(((b.latitude - a.latitude) * rad) / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(((b.longitude - a.longitude) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

const located = (point) => Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude);

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// point(record) → { latitude, longitude } for a record (defaults to the record itself).
export function nearDestination(records, destination, point = (record) => record) {
  const withCoords = records.filter((record) => located(point(record)));
  const center = located(destination) ? destination : withCoords.length ? { latitude: median(withCoords.map((record) => point(record).latitude)), longitude: median(withCoords.map((record) => point(record).longitude)) } : null;
  if (!center) return records;
  const limit = located(destination) ? NEAR_KM : REGION_KM;
  return records.filter((record) => !located(point(record)) || distanceKm(center, point(record)) <= limit);
}
