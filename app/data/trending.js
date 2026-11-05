import { destinations } from "./destinations.js";
import { estimateTrip } from "../lib/recommendation/tripEstimate.js";
import { sizedPhoto } from "../lib/format.js";

// Homepage, 404 and destination index all show these trips the same way.
const TRENDING = [
  { id: "las-vegas-76868", nights: 3, vibe: "Shows & neon", image: "https://images.unsplash.com/photo-1581351721010-8cf859cb14a4", alt: "The Las Vegas Strip at night with the Bellagio fountains" },
  { id: "oaxaca-city-41937", nights: 5, vibe: "Markets & mole", alt: "The ruins of Monte Albán above Oaxaca" },
  { id: "HAN", nights: 5, vibe: "Street food & history", image: "https://images.unsplash.com/photo-1613131145282-9476375618e1", alt: "Scooters passing a corner café in Hanoi's Old Quarter" },
];

export function displayName(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s&,(-])\S/g, (letter) => letter.toUpperCase());
}

export const trendingTrips = TRENDING.map((trip) => {
  const destination = destinations.find((item) => item.id === trip.id);
  return {
    ...trip,
    image: trip.image || sizedPhoto(destination.image, 960),
    name: displayName(destination.city),
    country: displayName(destination.country),
    estimate: estimateTrip(destination, { nights: trip.nights, travelers: 2 }),
    planning: destination.planningAverages?.monthly?.[4] || null,
  };
});
