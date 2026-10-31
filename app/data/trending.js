import { destinations } from "./destinations.js";
import { estimateTrip } from "../lib/recommendation/tripEstimate.js";

// Homepage, 404 and destination index all show these trips the same way.
const TRENDING = [
  { id: "MEX", nights: 7, vibe: "Food & art", image: "https://images.unsplash.com/photo-1518659526054-190340b32735", alt: "Mexico City seen from above" },
  { id: "HAN", nights: 5, vibe: "Street food & history", image: "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a", alt: "A street scene in Hanoi" },
  { id: "LIS", nights: 5, vibe: "Food & walking", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b", alt: "Lisbon rooftops in warm light" },
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
