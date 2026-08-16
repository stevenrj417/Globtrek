import { destinations } from "../app/data/destinations.js";
import { hotelCatalog } from "../app/data/hotels.js";
import googlePayload from "./hotels/google-places-results.json" with { type: "json" };

const hotels = destinations.flatMap((destination) => (hotelCatalog[destination.city] || []).map((hotel) => ({ ...(typeof hotel === "string" ? { name: hotel } : hotel), destinationId: destination.airport })));
const byDestination = Object.fromEntries(destinations.map((destination) => [destination.airport, { destination: destination.city, hotels: hotels.filter((hotel) => hotel.destinationId === destination.airport).length, activities: 0 }]));
const google = googlePayload.summary || {};
const pricedHotels = hotels.filter((hotel) => hotel.typicalNightlyLow != null && hotel.typicalNightlyHigh != null).length;
const cjHotels = hotels.filter((hotel) => hotel.bookingUrl).length;
const readiness = Object.values(byDestination).map((item) => ({ ...item, ready: item.hotels >= 9 && item.activities >= 12 }));
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), runtimeDestinations: destinations.length, recommendationReady: readiness.filter((item) => item.ready).length, hotels: { total: hotels.length, priced: pricedHotels, cjTracked: cjHotels, googlePlaceMatched: google.matched || 0, googlePhotos: google.withPhotos || 0, requiringReview: google.requiringReview || 0 }, activities: { total: 0 }, coverageBands: { hotels: { zero: readiness.filter((item) => item.hotels === 0).length, oneToThree: readiness.filter((item) => item.hotels >= 1 && item.hotels <= 3).length, fourToEight: readiness.filter((item) => item.hotels >= 4 && item.hotels <= 8).length, ninePlus: readiness.filter((item) => item.hotels >= 9).length }, activities: { zero: readiness.filter((item) => item.activities === 0).length, oneToFive: 0, sixToEleven: 0, twelvePlus: 0 } }, perDestination: readiness }, null, 2));
