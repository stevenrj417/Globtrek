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
  const perDestination = destinations.map((item) => ({ id: item.id || item.destinationId, name: item.name || item.city, hotels: hotelCounts.get(item.id || item.destinationId) || 0, activities: activityCounts.get(item.id || item.destinationId) || 0 }));
  return {
    totalDestinations: destinations.length,
    knownnessTiers: Object.fromEntries(KNOWNNESS_TIERS.map(([low, high], index) => [`${low}-${high}`, destinations.filter((item) => knownnessTier(item.knownnessScore) === index).length])),
    costTiers: Object.fromEntries([...COST_LEVELS].map((level) => [level, destinations.filter((item) => item.costLevel === level).length])),
    costByKnownnessTier: Object.fromEntries(KNOWNNESS_TIERS.map(([low, high], index) => [`${low}-${high}`, Object.fromEntries([...COST_LEVELS].map((level) => [level, destinations.filter((item) => knownnessTier(item.knownnessScore) === index && item.costLevel === level).length]))])),
    hotelCoverage: countBands(perDestination, [["0", (item) => item.hotels === 0], ["1-5", (item) => item.hotels >= 1 && item.hotels <= 5], ["6-11", (item) => item.hotels >= 6 && item.hotels <= 11], ["12+", (item) => item.hotels >= 12]]),
    activityCoverage: countBands(perDestination, [["0", (item) => item.activities === 0], ["1-9", (item) => item.activities >= 1 && item.activities <= 9], ["10-19", (item) => item.activities >= 10 && item.activities <= 19], ["20+", (item) => item.activities >= 20]]),
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
