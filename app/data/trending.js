import { destinations } from "./destinations.js";
import { estimateTrip } from "../lib/recommendation/tripEstimate.js";

// Homepage, 404 and destination index all show these trips the same way.
const TRENDING = [
  { id: "MEX", nights: 7, vibe: "Food & art", image: "https://images.unsplash.com/photo-1518659526054-190340b32735", alt: "Mexico City seen from above" },
  { id: "HAN", nights: 5, vibe: "Street food & history", image: "https://images.unsplash.com/photo-1613131145282-9476375618e1", alt: "Scooters passing a corner café in Hanoi's Old Quarter" },
  { id: "LIS", nights: 5, vibe: "Food & walking", image: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a", alt: "A yellow tram beside the arcades of Praça do Comércio in Lisbon" },
];

export function displayName(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s&,(-])\S/g, (letter) => letter.toUpperCase());
}

export const trendingTrips = TRENDING.map((trip) => {
  const destination = destinations.find((item) => item.id === trip.id);
  return {
    ...trip,
    name: displayName(destination.city),
    country: displayName(destination.country),
    estimate: estimateTrip(destination, { nights: trip.nights, travelers: 2 }),
    planning: destination.planningAverages?.monthly?.[4] || null,
  };
});
