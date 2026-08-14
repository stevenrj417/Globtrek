const SCORE_FIELDS = ["luxuryScore", "relaxationScore", "designScore", "nightlifeScore", "localFeelScore", "familyScore", "romanticScore", "centralityScore", "valueScore"];

function inferredScore(hotel, tag, fallback = 50) {
  if (Number.isFinite(hotel[tag])) return hotel[tag];
  const map = {
    luxuryScore: ["Premium", "Blowout"], relaxationScore: ["Slow mornings", "Mostly relaxing", "Wellness"], designScore: ["Design hotel", "Boutique hotel"], nightlifeScore: ["Nightlife", "Packed schedule"], localFeelScore: ["Traditional inn", "Culture"], familyScore: ["Family"], romanticScore: ["Couple", "Honeymoon"], valueScore: ["Smart value", "Comfortable"],
  };
  return map[tag]?.some((value) => hotel.tags?.includes(value)) ? 82 : fallback;
}

export function rankHotels(hotels, profile, budgetPlan) {
  const nights = Math.max(1, profile.tripLength);
  const nightlyAllowance = (budgetPlan?.hotelBudget || 0) / nights;
  return hotels.filter((hotel) => hotel.active !== false).map((hotel) => {
    const low = hotel.typicalNightlyLow == null ? Number.NaN : Number(hotel.typicalNightlyLow);
    const high = hotel.typicalNightlyHigh == null ? Number.NaN : Number(hotel.typicalNightlyHigh);
    const hasPrice = Number.isFinite(low) && Number.isFinite(high);
    const checkedAt = Date.parse(hotel.priceLastChecked || hotel.lastPriceUpdated || "");
    const priceStale = hasPrice && (!Number.isFinite(checkedAt) || Date.now() - checkedAt > 180 * 86400000);
    const midpoint = hasPrice ? (low + high) / 2 : null;
    const rawBudgetFit = !profile.includedBudgetCategories.hotel ? 70 : !hasPrice ? 48 : midpoint <= nightlyAllowance ? 100 : Math.max(0, Math.round(100 - ((midpoint - nightlyAllowance) / Math.max(nightlyAllowance, 1)) * 100));
    const budgetFit = priceStale ? Math.round(rawBudgetFit * 0.82) : rawBudgetFit;
    const preferences = {
      luxuryScore: profile.otherExistingQuizPreferences.memory === "Blowout" ? 90 : 65,
      relaxationScore: profile.relaxationPreference === "high" ? 90 : 55,
      designScore: profile.hotelPreference === "Design hotel" || profile.hotelPreference === "Boutique hotel" ? 90 : 55,
      nightlifeScore: profile.interests.includes("Nightlife") ? 88 : 35,
      localFeelScore: profile.interests.includes("Culture") ? 85 : 55,
      familyScore: profile.companions === "Family" ? 90 : 50,
      romanticScore: ["Couple", "Honeymoon"].includes(profile.companions) ? 90 : 50,
      centralityScore: 65,
      valueScore: (budgetPlan?.budgetFeasibilityScore ?? 50) < 80 ? 90 : 65,
    };
    const traitFit = SCORE_FIELDS.reduce((sum, field) => sum + (100 - Math.abs(inferredScore(hotel, field) - preferences[field])), 0) / SCORE_FIELDS.length;
    const tagMatches = hotel.tags?.filter((tag) => Object.values(profile.otherExistingQuizPreferences).includes(tag)).length || 0;
    const hotelMatchScore = Math.round(budgetFit * 0.45 + traitFit * 0.45 + Math.min(100, tagMatches * 25) * 0.1);
    return { ...hotel, hotelMatchScore, budgetFit, priceKnown: hasPrice, priceStale, imageMissing: !hotel.image, estimatedStayLow: hasPrice ? Math.round(low * nights) : null, estimatedStayHigh: hasPrice ? Math.round(high * nights) : null };
  }).sort((a, b) => b.hotelMatchScore - a.hotelMatchScore || a.name.localeCompare(b.name));
}

export function shortlistHotels(hotels, profile, budgetPlan) {
  const ranked = rankHotels(hotels, profile, budgetPlan).slice(0, 3);
  return ranked.map((hotel, index) => ({ ...hotel, descriptor: index === 0 ? "Our pick" : hotel.priceKnown ? (index === 1 ? "Lower price" : "Upgrade") : (index === 1 ? "Another fit" : "Different style") }));
}
