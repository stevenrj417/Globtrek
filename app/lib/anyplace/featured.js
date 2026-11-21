// Places GlobTrek already has a hand-built page for keep using that page.
import { destinations } from "../../data/destinations.js";
import { publishedDestinations } from "../../data/destinationCatalog.js";
import { distanceKm, normalizeText } from "./rank.js";

const coords = new Map(destinations.map((item) => [item.id || item.airport, item]));
const FEATURED = publishedDestinations.map((item) => {
  const source = coords.get(item.id);
  return { slug: item.slug, name: normalizeText(item.name), latitude: Number(source?.latitude), longitude: Number(source?.longitude) };
}).filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));

// The featured page for this place: same name within 25 km, or any featured
// place within 2 km of its center. Null for everywhere else.
export function featuredSlug(destination) {
  const name = normalizeText(destination?.name);
  let best = null;
  for (const item of FEATURED) {
    const km = distanceKm(destination.center, item);
    if (km === null) continue;
    if ((km <= 25 && item.name === name) || km <= 2) if (!best || km < best.km) best = { slug: item.slug, km };
  }
  return best?.slug || null;
}
