import { destinations } from "../app/data/destinations.js";
import { hotelCatalog } from "../app/data/hotels.js";
import googlePayload from "./hotels/google-places-results.json" with { type: "json" };
import kyotoActivities from "./activities/verified-kyoto-batch-01.json" with { type: "json" };
import { normalizeName } from "./hotels/catalog-tools.mjs";
import { DESTINATION_TYPES } from "../app/data/destinationIntelligence.js";

const normalize = (value) => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const canonicalSpelling = (value) => normalize(value).replace(/marrakesh/g, "marrakech");
const duplicates = (records, key) => [...records.reduce((map, item) => map.set(key(item), [...(map.get(key(item)) || []), item]), new Map())].filter(([, items]) => items.length > 1).map(([value, items]) => ({ value, count: items.length }));
const destinationIds = new Set(destinations.map((item) => item.id || item.airport));
const hotels = destinations.flatMap((destination) => (hotelCatalog[destination.city] || []).map((hotel) => ({ ...(typeof hotel === "string" ? { name: hotel } : hotel), destinationId: destination.id || destination.airport })));
const activities = kyotoActivities.records || [];
const countBy = (records) => records.reduce((map, item) => map.set(item.destinationId, (map.get(item.destinationId) || 0) + 1), new Map());
const hotelCounts = countBy(hotels);
const activityCounts = countBy(activities);
const destinationDuplicates = duplicates(destinations, (item) => `${canonicalSpelling(item.city)}|${normalize(item.country)}`);
const canonicalNames = new Set(destinations.map((item) => canonicalSpelling(item.city)));
const aliasOwners = destinations.flatMap((item) => (item.aliases || []).map((alias) => ({ alias, destinationId: item.id || item.airport, country: normalize(item.country) }))).filter((item) => canonicalNames.has(canonicalSpelling(item.alias)) && canonicalSpelling(item.alias) !== item.country);
const duplicateAliases = [...aliasOwners.reduce((map, item) => map.set(canonicalSpelling(item.alias), [...(map.get(canonicalSpelling(item.alias)) || []), item]), new Map())]
  .filter(([, items]) => new Set(items.map((item) => item.destinationId)).size > 1 && new Set(items.map((item) => item.country)).size === 1)
  .map(([value, items]) => ({ value, destinationIds: [...new Set(items.map((item) => item.destinationId))] }));
const coordinateDuplicates = duplicates(destinations.filter((item) => item.latitude != null && item.longitude != null), (item) => `${Number(item.latitude).toFixed(5)}|${Number(item.longitude).toFixed(5)}`);
const hotelDuplicates = duplicates(hotels, (item) => `${item.destinationId}|${normalizeName(item.name)}`);
const invalidHotelRelationships = hotels.filter((item) => !destinationIds.has(item.destinationId)).map((item) => item.name);
const validBookingPropertyUrl = (value) => { try { const url = new URL(value); return url.protocol === "https:" && /(^|\.)booking\.com$/.test(url.hostname) && /\/hotel\/[^/]+\/[^/]+\.html$/.test(url.pathname); } catch { return false; } };
const brokenProviderLinks = hotels.filter((item) => !validBookingPropertyUrl(item.bookingUrl)).map((item) => item.name);
const missingHeroImages = destinations.filter((item) => !item.image).map((item) => item.city);
const insufficientHotels = destinations.filter((item) => (hotelCounts.get(item.id || item.airport) || 0) < 27).map((item) => ({ destinationId: item.id || item.airport, count: hotelCounts.get(item.id || item.airport) || 0 }));
const insufficientActivities = destinations.filter((item) => (activityCounts.get(item.id || item.airport) || 0) < 12).map((item) => ({ destinationId: item.id || item.airport, count: activityCounts.get(item.id || item.airport) || 0 }));
const destinationMetadata = {
  missingType: destinations.filter((item) => !DESTINATION_TYPES.has(item.destinationType)).map((item) => item.city),
  missingSearchCenters: destinations.filter((item) => !item.hotelSearchCenters?.length).map((item) => item.city),
  missingPrimaryAirports: destinations.filter((item) => !item.primaryAirportCodes?.length).map((item) => item.city),
  costModelRequiresReview: destinations.filter((item) => item.costModelReviewStatus !== "verified_editorial").map((item) => item.city),
  notProductionReady: destinations.filter((item) => !item.productionReady).map((item) => item.city),
};
const priceBuckets = ["value", "midrange", "premium"];
const vibeBuckets = ["calm", "balanced", "energetic"];
const matrixCell = (hotel) => ({ price: hotel.priceTier || "unclassified", vibe: hotel.calmScore >= 70 ? "calm" : hotel.energyScore >= 70 || hotel.socialScore >= 70 ? "energetic" : "balanced" });
const hotelMatrixCoverage = Object.fromEntries(destinations.map((destination) => {
  const pool = hotels.filter((hotel) => hotel.destinationId === (destination.id || destination.airport) && hotel.recommendationReady === true);
  const cells = Object.fromEntries(priceBuckets.flatMap((price) => vibeBuckets.map((vibe) => [`${price}.${vibe}`, pool.filter((hotel) => { const cell = matrixCell(hotel); return cell.price === price && cell.vibe === vibe; }).length])));
  return [destination.id || destination.airport, { totalRecommendationReady: pool.length, cells }];
}));
const report = {
  totals: { destinations: destinations.length, hotels: hotels.length, activities: activities.length, restaurants: 0 },
  integrity: { destinationDuplicates, duplicateAliases, coordinateDuplicates, missingHeroImages, invalidHotelRelationships, hotelDuplicates, brokenProviderLinks },
  destinationMetadata,
  coverage: { destinationsAt27Hotels: destinations.length - insufficientHotels.length, destinationsWithTwelveActivities: destinations.length - insufficientActivities.length, insufficientHotels, insufficientActivities, insufficientRestaurants: destinations.map((item) => ({ destinationId: item.id || item.airport, count: 0 })), hotelMatrixCoverage },
  hotelPhotos: { matched: googlePayload.summary?.matched || 0, withAnyPhoto: googlePayload.summary?.withPhotos || 0, withThreePhotos: googlePayload.summary?.withThreePhotos || 0, requiringReview: googlePayload.summary?.requiringReview || 0 },
};
console.log(JSON.stringify(report, null, 2));
if (destinationDuplicates.length || duplicateAliases.length || coordinateDuplicates.length || missingHeroImages.length || invalidHotelRelationships.length || hotelDuplicates.length || brokenProviderLinks.length || destinationMetadata.missingType.length || destinationMetadata.missingSearchCenters.length || destinations.length !== 300) process.exitCode = 2;
