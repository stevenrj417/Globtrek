// Shared by the quiz, the booking page and the server: budget levels and the
// extras a traveler can ask for help with. No partner data here, so it stays
// small in the browser.
// Levels, cheapest first. A budget trip never sees private drivers, yachts or
// fine dining; a luxury trip sees them first.
export const LEVELS = ["budget", "mid", "comfort", "luxury"];

// What a traveler can say they want help with, in the quiz.
export const EXTRA_INTERESTS = Object.freeze([
  { id: "car", label: "Rental car" },
  { id: "rides", label: "Airport rides" },
  { id: "driver", label: "Private driver", minLevel: "comfort" },
  { id: "tours", label: "Tours and tickets" },
  { id: "food", label: "Food experiences" },
  { id: "luxury", label: "Luxury experiences", minLevel: "comfort" },
  { id: "esim", label: "Phone data (eSIM)" },
]);
const INTEREST_IDS = new Set(EXTRA_INTERESTS.map((item) => item.id));
export function cleanInterests(value) {
  const list = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(list.map((item) => String(item).trim()).filter((item) => INTEREST_IDS.has(item)))].slice(0, EXTRA_INTERESTS.length);
}

// The quiz's sleep band (or the any-place budget key) as a level.
export function levelFrom({ budget, lodging, band } = {}) {
  if (LEVELS.includes(budget)) return budget;
  if (lodging === "luxury") return "luxury";
  return { tight: "budget", middle: "mid", roomy: "comfort" }[band] || "mid";
}

