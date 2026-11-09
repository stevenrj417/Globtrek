// Client-safe half of durationFloors.js: no budget engine, just the arithmetic.
const CATEGORIES = ["hotel", "food", "activities", "transportation"];

// The cheapest trip of this length with these budget categories, or null when unknown.
export function cheapestTrip(floors, nights, includes) {
  if (!floors?.ground?.length) return null;
  return Math.round(Math.min(...floors.ground.map(({ fixed, perNight, flight }) => CATEGORIES.reduce((sum, key) => sum + (includes[key] ? fixed[key] + perNight[key] * nights : 0), includes.flights ? flight : 0))));
}
