const SCORE_FIELDS = ["luxuryScore", "relaxationScore", "calmScore", "energyScore", "designScore", "nightlifeScore", "localFeelScore", "familyScore", "romanticScore", "centralityScore", "valueScore", "socialScore", "businessScore"];

const clamp = (value, low = 0, high = 100) => Math.min(high, Math.max(low, Number(value) || 0));

function inferredScore(hotel, tag, fallback = 50) {
  if (Number.isFinite(hotel[tag])) return hotel[tag];
  const map = {
    luxuryScore: ["Premium", "Blowout"], relaxationScore: ["Slow mornings", "Mostly relaxing", "Wellness"], calmScore: ["Slow mornings", "Mostly relaxing", "Wellness"], energyScore: ["Nightlife", "Packed schedule"], designScore: ["Design hotel", "Boutique hotel"], nightlifeScore: ["Nightlife", "Packed schedule"], localFeelScore: ["Traditional inn", "Culture"], familyScore: ["Family"], romanticScore: ["Couple", "Honeymoon"], valueScore: ["Smart value", "Comfortable"], socialScore: ["Friends", "Nightlife", "Packed schedule"], businessScore: ["Business"],
  };
  return map[tag]?.some((value) => hotel.tags?.includes(value)) ? 82 : fallback;
}

export function hotelRecommendationGroup(hotel) {
  const relaxed = (inferredScore(hotel, "relaxationScore") * 0.7) + ((100 - inferredScore(hotel, "nightlifeScore")) * 0.3);
  const social = (inferredScore(hotel, "nightlifeScore") * 0.55) + (inferredScore(hotel, "centralityScore") * 0.45);
  const premium = (inferredScore(hotel, "luxuryScore") * 0.6) + (inferredScore(hotel, "designScore") * 0.4);
  return [["relaxed", relaxed], ["social", social], ["premium", premium]].sort((a, b) => b[1] - a[1])[0][0];
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
    const luxuryPreference = profile.otherExistingQuizPreferences.memory;
    const typicalHotelMidpoint = budgetPlan?.estimates?.hotel ? ((budgetPlan.estimates.hotel.low || 0) + (budgetPlan.estimates.hotel.high || 0)) / (2 * nights) : 0;
    const allowanceRatio = typicalHotelMidpoint > 0 ? nightlyAllowance / typicalHotelMidpoint : 1;
    const explicitTier = ["Blowout", "Premium"].includes(luxuryPreference) ? "premium" : luxuryPreference === "Smart value" ? "value" : ["Comfortable", "Mid-range", "Midrange"].includes(luxuryPreference) ? "midrange" : null;
    const preferredPriceTier = explicitTier || (allowanceRatio >= 1.35 ? "premium" : allowanceRatio <= 0.8 ? "value" : "midrange");
    const priceTierFit = !hotel.priceTier ? 50 : hotel.priceTier === preferredPriceTier ? 100 : 35;
    const calmTarget = profile.relaxationPreference === "high" ? 92 : profile.relaxationPreference === "low" ? 30 : 62;
    const energyTarget = profile.relaxationPreference === "low" || profile.interests.includes("Nightlife") ? 92 : profile.relaxationPreference === "high" ? 28 : 62;
    const preferences = {
      luxuryScore: profile.otherExistingQuizPreferences.memory === "Blowout" ? 90 : 65,
      relaxationScore: profile.relaxationPreference === "high" ? 90 : 55,
      calmScore: calmTarget,
      energyScore: energyTarget,
      designScore: profile.hotelPreference === "Design hotel" || profile.hotelPreference === "Boutique hotel" ? 90 : 55,
      nightlifeScore: profile.interests.includes("Nightlife") ? 88 : 35,
      localFeelScore: profile.interests.includes("Culture") ? 85 : 55,
      familyScore: profile.companions === "Family" ? 90 : 50,
      romanticScore: ["Couple", "Honeymoon"].includes(profile.companions) ? 90 : 50,
      centralityScore: 65,
      valueScore: (budgetPlan?.budgetFeasibilityScore ?? 50) < 80 ? 90 : 65,
      socialScore: profile.interests.includes("Nightlife") || profile.companions === "Friends" ? 90 : 40,
      businessScore: profile.companions === "Business" ? 90 : 35,
    };
    const traitFit = SCORE_FIELDS.reduce((sum, field) => sum + (100 - Math.abs(inferredScore(hotel, field) - preferences[field])), 0) / SCORE_FIELDS.length;
    const tagMatches = hotel.tags?.filter((tag) => Object.values(profile.otherExistingQuizPreferences).includes(tag)).length || 0;
    const ratingQuality = hotel.rating == null ? 50 : clamp((Number(hotel.rating) - 3) * 50);
    const reviewQuality = hotel.reviewCount == null ? 45 : clamp(Math.log10(Math.max(1, Number(hotel.reviewCount))) * 25);
    const evidenceQuality = [hotel.identityConfidence, hotel.locationConfidence, hotel.dataCompletenessScore == null ? null : Number(hotel.dataCompletenessScore) / 100].filter(Number.isFinite);
    const confidenceQuality = evidenceQuality.length ? (evidenceQuality.reduce((sum, value) => sum + clamp(value * 100), 0) / evidenceQuality.length) : 50;
    const qualityFit = ratingQuality * 0.45 + reviewQuality * 0.2 + confidenceQuality * 0.35;
    const hotelMatchScore = Math.round(budgetFit * 0.27 + traitFit * 0.31 + priceTierFit * 0.22 + qualityFit * 0.15 + Math.min(100, tagMatches * 25) * 0.05);
    return { ...hotel, hotelMatchScore, budgetFit, priceTierFit, qualityFit: Math.round(qualityFit), preferredPriceTier, priceKnown: hasPrice, priceStale, imageMissing: !hotel.image, estimatedStayLow: hasPrice ? Math.round(low * nights) : null, estimatedStayHigh: hasPrice ? Math.round(high * nights) : null };
  }).sort((a, b) => b.hotelMatchScore - a.hotelMatchScore || a.name.localeCompare(b.name));
}

export function shortlistHotels(hotels, profile, budgetPlan) {
  const seen = new Set();
  const unique = hotels.filter((hotel) => {
    const identity = hotel.providerPropertyId || hotel.googlePlaceId || `${hotel.destinationId || ""}|${hotel.name}`.toLocaleLowerCase();
    if (seen.has(identity)) return false;
    seen.add(identity); return true;
  });
  const ranked = rankHotels(unique, profile, budgetPlan);
  if (!ranked.length) return [];
  const selected = [ranked[0]];
  const groups = new Set([hotelRecommendationGroup(ranked[0])]);
  while (selected.length < 3) {
    const differentGroup = ranked.find((hotel) => !selected.includes(hotel) && !groups.has(hotelRecommendationGroup(hotel)));
    const next = differentGroup || ranked.find((hotel) => !selected.includes(hotel));
    if (!next) break;
    selected.push(next);
    groups.add(hotelRecommendationGroup(next));
  }
  const valueIndex = selected.length > 1
    ? selected.map((hotel, index) => ({ index, score: hotel.budgetFit + inferredScore(hotel, "valueScore") })).slice(1).sort((a, b) => b.score - a.score)[0]?.index
    : -1;
  return selected.map((hotel, index) => ({
    ...hotel,
    recommendationGroup: hotelRecommendationGroup(hotel),
    descriptor: index === 0 ? "Our pick" : index === valueIndex ? "Best value" : "Upgrade",
  }));
}
