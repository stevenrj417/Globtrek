import { destinations } from "../app/data/destinations.js";
import { hotelCatalog } from "../app/data/hotels.js";
import googlePayload from "./hotels/google-places-results.json" with { type: "json" };
import kyotoActivities from "./activities/verified-kyoto-batch-01.json" with { type: "json" };

const hotels = destinations.flatMap((destination) => (hotelCatalog[destination.city] || []).map((hotel) => ({ ...(typeof hotel === "string" ? { name: hotel } : hotel), destinationId: destination.id || destination.airport })));
const activities = kyotoActivities.records || [];
const byDestination = Object.fromEntries(destinations.map((destination) => {
  const key = destination.id || destination.airport;
  return [key, { destinationId: key, destination: destination.city, hotels: hotels.filter((hotel) => hotel.destinationId === key).length, activities: activities.filter((activity) => activity.destinationId === key).length }];
}));
const google = googlePayload.summary || {};
const pricedHotels = hotels.filter((hotel) => hotel.typicalNightlyLow != null && hotel.typicalNightlyHigh != null).length;
const cjHotels = hotels.filter((hotel) => hotel.bookingUrl).length;
const readiness = Object.values(byDestination).map((item) => ({ ...item, ready: item.hotels >= 9 && item.activities >= 12 }));
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), runtimeDestinations: destinations.length, recommendationReady: readiness.filter((item) => item.ready).length, hotels: { total: hotels.length, priced: pricedHotels, cjTracked: cjHotels, googlePlaceMatched: google.matched || 0, googlePhotos: google.withPhotos || 0, requiringReview: google.requiringReview || 0 }, activities: { total: activities.length }, coverageBands: { hotels: { zero: readiness.filter((item) => item.hotels === 0).length, oneToThree: readiness.filter((item) => item.hotels >= 1 && item.hotels <= 3).length, fourToEight: readiness.filter((item) => item.hotels >= 4 && item.hotels <= 8).length, ninePlus: readiness.filter((item) => item.hotels >= 9).length }, activities: { zero: readiness.filter((item) => item.activities === 0).length, oneToFive: readiness.filter((item) => item.activities >= 1 && item.activities <= 5).length, sixToEleven: readiness.filter((item) => item.activities >= 6 && item.activities <= 11).length, twelvePlus: readiness.filter((item) => item.activities >= 12).length } }, perDestination: readiness }, null, 2));
