import { createHash } from "node:crypto";

export const KNOWNNESS_TIERS = Object.freeze([[0, 20], [21, 40], [41, 60], [61, 80], [81, 100]]);
export const COST_LEVELS = new Set(["affordable", "moderate", "upscale", "luxury"]);

export function destinationId(name, country) {
  return `${String(name).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${createHash("sha1").update(country).digest("hex").slice(0, 5)}`;
}

export function knownnessTier(score) {
  return KNOWNNESS_TIERS.findIndex(([low, high]) => score >= low && score <= high);
}

export function validateDestination(record) {
  const errors = [];
  if (!String(record.name || "").trim()) errors.push("missing_name");
  if (!String(record.country || "").trim()) errors.push("missing_country");
  if (!String(record.nearestAirport || "").match(/^[A-Z]{3}$/)) errors.push("invalid_airport");
  if (!Number.isFinite(Number(record.latitude)) || Number(record.latitude) < -90 || Number(record.latitude) > 90) errors.push("invalid_latitude");
  if (!Number.isFinite(Number(record.longitude)) || Number(record.longitude) < -180 || Number(record.longitude) > 180) errors.push("invalid_longitude");
  if (!Number.isInteger(record.knownnessScore) || knownnessTier(record.knownnessScore) < 0) errors.push("invalid_knownness");
  if (!COST_LEVELS.has(record.costLevel)) errors.push("invalid_cost_level");
  if (!record.costProfile || !["typicalHotelNightLow", "typicalHotelNightHigh", "foodDailyLow", "foodDailyHigh", "activitiesDailyLow", "activitiesDailyHigh", "transportDailyLow", "transportDailyHigh"].every((key) => Number.isFinite(Number(record.costProfile[key])))) errors.push("missing_cost_profile");
  if (!record.seasonality || !record.climateProfile) errors.push("missing_seasonality_or_climate");
  if (!Array.isArray(record.travelerTypeTags) || !Array.isArray(record.interestTags)) errors.push("missing_tags");
  if (!record.images?.length) errors.push("missing_images");
  else if (record.images.some((image) => !image.imageUrl || !image.sourcePageUrl || !image.licenseName || !image.verifiedAt)) errors.push("unlicensed_image");
  return [...new Set(errors)];
}

export function destinationCoverageReport(destinations, hotels = [], activities = []) {
  const hotelCounts = new Map();
  const activityCounts = new Map();
  hotels.filter((item) => item.active !== false).forEach((item) => hotelCounts.set(item.destinationId, (hotelCounts.get(item.destinationId) || 0) + 1));
  activities.filter((item) => item.active !== false).forEach((item) => activityCounts.set(item.destinationId, (activityCounts.get(item.destinationId) || 0) + 1));
  const countBands = (values, bands) => Object.fromEntries(bands.map(([name, test]) => [name, values.filter(test).length]));
  const perDestination = destinations.map((item) => {
    const id = item.id || item.destinationId;
    const destinationHotels = hotels.filter((hotel) => hotel.active !== false && hotel.destinationId === id);
    const destinationActivities = activities.filter((activity) => activity.active !== false && activity.destinationId === id);
    return {
      id,
      name: item.name || item.city,
      hotels: hotelCounts.get(id) || 0,
      activities: activityCounts.get(id) || 0,
      hotelPriceTiers: [...new Set(destinationHotels.map((hotel) => hotel.priceTier).filter(Boolean))],
      hotelVibes: [...new Set(destinationHotels.flatMap((hotel) => hotel.styleTags || hotel.tags || []))],
      affiliateHotels: destinationHotels.filter((hotel) => hotel.cjTrackingUrl && hotel.bookingComPropertyUrl).length,
      pricedHotels: destinationHotels.filter((hotel) => hotel.typicalNightlyLow != null && hotel.typicalNightlyHigh != null).length,
      affiliateActivities: destinationActivities.filter((activity) => activity.affiliateUrl || activity.bookingUrl).length,
    };
  });
  return {
    totalDestinations: destinations.length,
    knownnessTiers: Object.fromEntries(KNOWNNESS_TIERS.map(([low, high], index) => [`${low}-${high}`, destinations.filter((item) => knownnessTier(item.knownnessScore) === index).length])),
    costTiers: Object.fromEntries([...COST_LEVELS].map((level) => [level, destinations.filter((item) => item.costLevel === level).length])),
    costByKnownnessTier: Object.fromEntries(KNOWNNESS_TIERS.map(([low, high], index) => [`${low}-${high}`, Object.fromEntries([...COST_LEVELS].map((level) => [level, destinations.filter((item) => knownnessTier(item.knownnessScore) === index && item.costLevel === level).length]))])),
    recommendationReady: destinations.filter((item) => item.recommendationReady || item.recommendation_ready).length,
    hotelCoverage: countBands(perDestination, [["0", (item) => item.hotels === 0], ["1-3", (item) => item.hotels >= 1 && item.hotels <= 3], ["4-8", (item) => item.hotels >= 4 && item.hotels <= 8], ["9+", (item) => item.hotels >= 9]]),
    activityCoverage: countBands(perDestination, [["0", (item) => item.activities === 0], ["1-5", (item) => item.activities >= 1 && item.activities <= 5], ["6-11", (item) => item.activities >= 6 && item.activities <= 11], ["12+", (item) => item.activities >= 12]]),
    hotelDataCoverage: {
      affiliateLinks: hotels.filter((item) => item.active !== false && item.cjTrackingUrl && item.bookingComPropertyUrl).length,
      priceEstimates: hotels.filter((item) => item.active !== false && item.typicalNightlyLow != null && item.typicalNightlyHigh != null).length,
      propertyPhotos: hotels.filter((item) => item.active !== false && item.imageUrl && item.imageSource).length,
      needsReview: hotels.filter((item) => item.active !== false && !["verified", "rejected"].includes(item.reviewStatus || item.review_status)).length,
    },
    activityDataCoverage: {
      affiliateLinks: activities.filter((item) => item.active !== false && (item.affiliateUrl || item.bookingUrl)).length,
      priceEstimates: activities.filter((item) => item.active !== false && item.estimatedCostLow != null && item.estimatedCostHigh != null).length,
      photos: activities.filter((item) => item.active !== false && item.imageUrl && item.imageSource).length,
      informationalOnly: activities.filter((item) => item.active !== false && !item.affiliateUrl && !item.bookingUrl).length,
      needsReview: activities.filter((item) => item.active !== false && !["verified", "rejected"].includes(item.reviewStatus || item.review_status)).length,
    },
    photoCoverage: {
      hero: destinations.filter((item) => item.images?.some((image) => image.isHero) || item.primaryImageUrl).length,
      threePlus: destinations.filter((item) => (item.images || []).length >= 3).length,
    },
    missing: {
      photos: destinations.filter((item) => !item.images?.length && !item.primaryImageUrl).length,
      costProfiles: destinations.filter((item) => !item.costProfile).length,
      seasonality: destinations.filter((item) => !item.seasonality).length,
      coordinates: destinations.filter((item) => !Number.isFinite(Number(item.latitude)) || !Number.isFinite(Number(item.longitude))).length,
      hotelCoverage: perDestination.filter((item) => item.hotels === 0).length,
      activityCoverage: perDestination.filter((item) => item.activities === 0).length,
    },
    totalVerifiedDestinations: destinations.filter((item) => item.verifiedAt && item.verificationSource).length,
    totalVerifiedHotels: hotels.filter((item) => item.reviewStatus === "verified" || item.review_status === "verified").length,
    totalVerifiedActivities: activities.filter((item) => item.reviewStatus === "verified" || item.review_status === "verified").length,
    destinationsRequiringReview: destinations.filter((item) => validateDestination(item).length > 0 || !item.recommendationReady).length,
    perDestination,
  };
}
