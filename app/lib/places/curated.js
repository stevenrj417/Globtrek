// Server-side: the full curated places file is too large for the browser, which
// reads only app/data/curatedPlaceCounts.json (see eligibility.js).
import curatedPlaces from "../../data/curatedPlaces.json" with { type: "json" };

export function curatedActivities(destinationId) {
  return curatedPlaces.places?.[destinationId]?.activities || [];
}

export function curatedRestaurants(destinationId) {
  return curatedPlaces.places?.[destinationId]?.restaurants || [];
}
