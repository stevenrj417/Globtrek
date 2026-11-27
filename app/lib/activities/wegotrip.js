import wegotripCities from "../../data/wegotripCities.json" with { type: "json" };

// WeGoTrip products (public API, no key): self-guided audio tours and
// attraction tickets with real prices, photos and ratings. Products are ranked
// by the traveler's quiz answers, not by provider popularity alone.
// Prices are per person, requested in USD to match the rest of the trip.

export const WEGOTRIP_API = "https://app.wegotrip.com/api/v2";

// Quiz interest -> WeGoTrip categories that serve it.
export const INTEREST_CATEGORIES = Object.freeze({
  Culture: ["Art & Museums", "Architecture", "History & Heritage", "Cultural Tours", "Museum & Attraction Tickets", "Museum Tickets & Passes", "Literary, Art & Music Tours", "Walking Tours", "City tours"],
  Food: ["Food Tours", "Food & Drink", "Gastronomic Tours", "Wine Tours"],
  Nature: ["Day trips", "Nature & Adventure", "Hiking Tours", "Nature Tours", "Parks & Gardens"],
  Nightlife: ["Ghost & Vampire Tours", "Night Tours", "Pub Tours"],
  Wellness: ["Parks & Gardens"],
  Shopping: ["Walking Tours", "City tours"],
});

export function wegotripCity(destinationId) {
  return wegotripCities.cities?.[destinationId] || null;
}

export function normalizeProduct(item) {
  const price = Number(item?.price);
  if (!item?.id || !item.title || !Number.isFinite(price) || price < 0 || item.tags?.available === false) return null;
  // The same tour is often listed again in another language; GlobTrek's pages are in English.
  if (item.locale && item.locale !== "en") return null;
  const url = typeof item.url === "string" && item.url.startsWith("https://wegotrip.com/")
    ? item.url
    : item.slug && item.city?.slug && item.city?.id ? `https://wegotrip.com/${item.city.slug}-d${item.city.id}/${item.slug}-p${item.id}/` : null;
  if (!url) return null;
  return {
    id: `wegotrip-${item.id}`,
    provider: "wegotrip",
    name: item.title,
    category: item.category || null,
    image: item.preview || item.cover || null,
    imageCredit: "Photo: WeGoTrip",
    price,
    currency: item.currencyCode || "EUR",
    priceLabel: `${item.currency || ""}${price % 1 ? price.toFixed(2) : price}`.trim(),
    rating: Number.isFinite(Number(item.rating)) && item.ratingsCount > 0 ? Number(item.rating) : null,
    ratingsCount: Number(item.ratingsCount) || 0,
    durationMinutes: Number(item.durationMin) || null,
    duration: item.duration ? String(item.duration).replace(/^1 (hour|day|minute)s\b/i, "1 $1") : null,
    selfGuided: Boolean(item.tags?.audioguide),
    url,
  };
}

// Higher is a better fit. Interest dominates; then pace, budget and rating.
export function scoreProduct(product, { interest, pace, perPersonBudget } = {}) {
  let score = 0;
  const categories = INTEREST_CATEGORIES[interest] || [];
  if (interest && categories.includes(product.category)) score += 50;
  else if (interest && interest !== "Culture") score -= 10;
  const minutes = product.durationMinutes || 120;
  if (pace === "Slow mornings" || pace === "Mostly relaxing") score += minutes <= 150 ? 10 : -10;
  if (pace === "Packed schedule" || pace === "Adventure days") score += minutes >= 120 ? 8 : 0;
  // The allowance is in USD; other currencies aren't converted, so they skip this check.
  if (Number.isFinite(perPersonBudget) && product.currency === "USD") score += product.price <= perPersonBudget ? 10 : -25;
  // A 5.0 from one review shouldn't beat a 3.9 from a thousand: the rating is
  // pulled toward 4.2 until it has about 30 reviews, and reviews count on their own.
  if (product.rating) {
    const count = product.ratingsCount || 0;
    const steady = (product.rating * count + 4.2 * 30) / (count + 30);
    score += (steady - 4) * 20 + Math.log10(1 + count) * 8;
  }
  return Math.round(score);
}

// Words that name what a product is (a stadium, a palace, a district), for
// spotting the same thing sold several ways.
const PLAIN_WORDS = new Set(["ticket", "tickets", "entry", "entrance", "admission", "tour", "tours", "audio", "guide", "guided", "self", "walk", "walking", "through", "with", "priority",
  "skip", "line", "offer", "experience", "and", "the", "from", "city", "plus", "access", "area", "museum", "park", "historic", "heart", "old", "quarter", "quarters", "your", "private", "small", "group", "day", "trip", "half", "full", "hour", "hours", "meal", "snack", "wine", "tasting", "scarf", "fast", "track", "combo", "pass"]);
function keyWords(name, cityWords) {
  return new Set(String(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[^a-z]+/).filter((word) => word.length >= 4 && !PLAIN_WORDS.has(word) && !cityWords.has(word)));
}

// Best first, but the same sight or district only once until everything else
// has had a turn.
function diversify(products) {
  const cityWords = new Set();
  const counts = {};
  for (const product of products) for (const word of keyWords(product.name, cityWords)) counts[word] = (counts[word] || 0) + 1;
  // A word in most product names is the city itself ("lisbon"), not a sight.
  for (const [word, count] of Object.entries(counts)) if (count >= Math.max(4, products.length * 0.4)) cityWords.add(word);
  const picked = [];
  const later = [];
  const seen = new Set();
  for (const product of products) {
    const words = keyWords(product.name, cityWords);
    if ([...words].some((word) => seen.has(word))) later.push(product);
    else { picked.push(product); words.forEach((word) => seen.add(word)); }
  }
  return [...picked, ...later];
}

export function rankProducts(products, preferences = {}) {
  return diversify(products
    .map((product) => ({ ...product, fit: scoreProduct(product, preferences), matchesInterest: Boolean(preferences.interest && (INTEREST_CATEGORIES[preferences.interest] || []).includes(product.category)) }))
    .sort((a, b) => b.fit - a.fit || a.price - b.price || a.id.localeCompare(b.id)));
}

export async function fetchCityProducts(cityId, { fetchImpl = fetch, perPage = 60 } = {}) {
  const response = await fetchImpl(`${WEGOTRIP_API}/products/popular/?city=${Number(cityId)}&per_page=${perPage}&currency=USD`, { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`wegotrip_http_${response.status}`);
  const json = await response.json();
  return (json?.data?.results || []).map(normalizeProduct).filter(Boolean);
}
