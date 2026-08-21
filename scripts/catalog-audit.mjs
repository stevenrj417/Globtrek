import { destinations } from "../app/data/destinations.js";
import { hotelCatalog } from "../app/data/hotels.js";
import googlePayload from "./hotels/google-places-results.json" with { type: "json" };
import kyotoActivities from "./activities/verified-kyoto-batch-01.json" with { type: "json" };
import { normalizeName } from "./hotels/catalog-tools.mjs";

const normalize = (value) => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const duplicates = (records, key) => [...records.reduce((map, item) => map.set(key(item), [...(map.get(key(item)) || []), item]), new Map())].filter(([, items]) => items.length > 1).map(([value, items]) => ({ value, count: items.length }));
const destinationIds = new Set(destinations.map((item) => item.id || item.airport));
const hotels = destinations.flatMap((destination) => (hotelCatalog[destination.city] || []).map((hotel) => ({ ...(typeof hotel === "string" ? { name: hotel } : hotel), destinationId: destination.id || destination.airport })));
const activities = kyotoActivities.records || [];
const countBy = (records) => records.reduce((map, item) => map.set(item.destinationId, (map.get(item.destinationId) || 0) + 1), new Map());
const hotelCounts = countBy(hotels);
const activityCounts = countBy(activities);
const destinationDuplicates = duplicates(destinations, (item) => `${normalize(item.city)}|${normalize(item.country)}`);
const coordinateDuplicates = duplicates(destinations.filter((item) => item.latitude != null && item.longitude != null), (item) => `${Number(item.latitude).toFixed(5)}|${Number(item.longitude).toFixed(5)}`);
const hotelDuplicates = duplicates(hotels, (item) => `${item.destinationId}|${normalizeName(item.name)}`);
const invalidHotelRelationships = hotels.filter((item) => !destinationIds.has(item.destinationId)).map((item) => item.name);
const validBookingPropertyUrl = (value) => { try { const url = new URL(value); return url.protocol === "https:" && /(^|\.)booking\.com$/.test(url.hostname) && /\/hotel\/[^/]+\/[^/]+\.html$/.test(url.pathname); } catch { return false; } };
const brokenProviderLinks = hotels.filter((item) => !validBookingPropertyUrl(item.bookingUrl)).map((item) => item.name);
const missingHeroImages = destinations.filter((item) => !item.image).map((item) => item.city);
const insufficientHotels = destinations.filter((item) => (hotelCounts.get(item.id || item.airport) || 0) < 9).map((item) => ({ destinationId: item.id || item.airport, count: hotelCounts.get(item.id || item.airport) || 0 }));
const insufficientActivities = destinations.filter((item) => (activityCounts.get(item.id || item.airport) || 0) < 12).map((item) => ({ destinationId: item.id || item.airport, count: activityCounts.get(item.id || item.airport) || 0 }));
const report = {
  totals: { destinations: destinations.length, hotels: hotels.length, activities: activities.length, restaurants: 0 },
  integrity: { destinationDuplicates, coordinateDuplicates, missingHeroImages, invalidHotelRelationships, hotelDuplicates, brokenProviderLinks },
  coverage: { destinationsWithNineHotels: destinations.length - insufficientHotels.length, destinationsWithTwelveActivities: destinations.length - insufficientActivities.length, insufficientHotels, insufficientActivities, insufficientRestaurants: destinations.map((item) => ({ destinationId: item.id || item.airport, count: 0 })) },
  hotelPhotos: { matched: googlePayload.summary?.matched || 0, withAnyPhoto: googlePayload.summary?.withPhotos || 0, withThreePhotos: googlePayload.summary?.withThreePhotos || 0, requiringReview: googlePayload.summary?.requiringReview || 0 },
};
console.log(JSON.stringify(report, null, 2));
if (destinationDuplicates.length || coordinateDuplicates.length || missingHeroImages.length || invalidHotelRelationships.length || hotelDuplicates.length || brokenProviderLinks.length || destinations.length !== 300) process.exitCode = 2;
