import { fetchCityProducts, rankProducts, wegotripCity } from "./wegotrip.js";
import { partnerUrls } from "../travelpayouts/partnerCache.js";

// Bookable tours and tickets for a destination, ranked for the traveler, with
// Travelpayouts partner links. Products are cached per city for six hours.

const cache = new Map();
const TTL = 6 * 3600000;

export async function bookableActivities(destinationId, { interest, pace, perPersonBudget, limit = 6 } = {}) {
  const city = wegotripCity(destinationId);
  if (!city) return [];
  let products = cache.get(city.id)?.expires > Date.now() ? cache.get(city.id).products : null;
  if (!products) {
    try {
      products = await fetchCityProducts(city.id);
      cache.set(city.id, { products, expires: Date.now() + TTL });
      if (cache.size > 300) cache.delete(cache.keys().next().value);
    } catch {
      return [];
    }
  }
  const ranked = rankProducts(products, { interest, pace, perPersonBudget }).slice(0, limit);
  const links = await partnerUrls(ranked.map((product) => product.url), { subId: "activities" });
  return ranked.map((product, index) => ({ ...product, bookingUrl: links[index].partnerUrl || product.url, attributed: Boolean(links[index].partnerUrl) }));
}
