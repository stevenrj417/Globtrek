// Tags about who is going, trip length, pace or hotel style, not what the place is like.
const WHO_TAGS = new Set(["Couple", "Friends", "Family", "Solo", "Five Nights", "Long Weekend", "One Week", "Two Weeks", "Ten Days", "Packed schedule", "Slow mornings",
  "Balanced days", "Mostly relaxing", "Adventure days", "Design hotel", "Boutique hotel", "Beach resort", "Private villa", "Traditional inn", "Smart value", "Premium", "Luxury",
  "Blowout", "Surprise Me", "Mixed", "Business", "Honeymoon"]);

function kmBetween(a, b) {
  if (![a?.latitude, a?.longitude, b?.latitude, b?.longitude].every(Number.isFinite)) return null;
  const rad = Math.PI / 180;
  const h = Math.sin(((b.latitude - a.latitude) * rad) / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(((b.longitude - a.longitude) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Other trips like the one on screen: the same kind of place (shared tags), in
// the same part of the world, at a similar price, drawn from the traveler's own
// matches so they still fit the quiz.
export function pickAlternatives(matches, current, currentKey, count = 3) {
  const others = (matches || []).filter((item) => (item.id || item.airport) !== currentKey && item.city !== current?.city);
  if (!current) return others.slice(0, count);
  const tags = new Set((current.tags || []).filter((tag) => !WHO_TAGS.has(tag)));
  const price = current.budgetPlan?.budgetCheckTotal || 0;
  const scored = others.slice(0, 150).map((item, index) => {
    const shared = (item.tags || []).filter((tag) => tags.has(tag)).length;
    const km = kmBetween(current, item);
    const near = km == null ? 0 : km < 1500 ? 30 : km < 3500 ? 14 : km < 6000 ? 4 : 0;
    const itemPrice = item.budgetPlan?.budgetCheckTotal || 0;
    const priceGap = price && itemPrice ? Math.min(1, Math.abs(itemPrice - price) / price) : 0.5;
    return { item, score: shared * 8 + near - priceGap * 25 - index * 0.1 };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, count).map(({ item }) => item);
}
