import { DURATION_NIGHTS } from "../trip/schedule.js";

// The sleep question follows the budget: tight budgets see hostel beds and cheap
// rooms; bigger ones see private and comfortable rooms. Answers keep the same
// values ("Whatever's cheapest" = either, "Whole place" = a house or apartment
// for the group, split per person), so the trip engine is unchanged: it
// already plans the most comfortable stay the budget covers.
export const SLEEP_OPTIONS = {
  tight: [
    { label: "Whatever's cheapest", display: "Whatever's cheapest", image: "/quiz/v2/cheapest.jpg", alt: "A red-cottage hostel on Arholma, Sweden" },
    { label: "Hostel bed", display: "Hostel bed", image: "/quiz/v2/hostel-bed.jpg", alt: "A bright hostel bunk beside a tall window" },
    { label: "Private room", display: "Cheap private room", image: "/quiz/v2/private-room.jpg", alt: "A canopy bed in a quiet hotel suite" },
    { label: "Whole place", display: "A whole house or apartment", image: "/quiz/v2/cheapest.jpg", alt: "A red cottage on Arholma, Sweden" },
  ],
  middle: [
    { label: "Whatever's cheapest", display: "Whatever fits my budget", image: "/quiz/v2/cheapest.jpg", alt: "A red-cottage guesthouse on Arholma, Sweden" },
    { label: "Private room", display: "Private room", image: "/quiz/v2/private-room.jpg", alt: "A canopy bed in a quiet hotel suite" },
    { label: "Hostel bed", display: "Hostel bed", image: "/quiz/v2/hostel-bed.jpg", alt: "A bright hostel bunk beside a tall window" },
    { label: "Whole place", display: "A whole house or apartment", image: "/quiz/v2/cheapest.jpg", alt: "A red cottage on Arholma, Sweden" },
  ],
  roomy: [
    { label: "Private room", display: "Comfortable hotel room", image: "/quiz/v2/private-room.jpg", alt: "A canopy bed in a quiet hotel suite" },
    { label: "Whatever's cheapest", display: "Whatever fits my budget", image: "/quiz/v2/cheapest.jpg", alt: "A red-cottage guesthouse on Arholma, Sweden" },
    { label: "Whole place", display: "A whole house or apartment", image: "/quiz/v2/cheapest.jpg", alt: "A red cottage on Arholma, Sweden" },
  ],
};

// Rough money for a night's stay: about 40% of the budget goes to lodging.
export function sleepBand(answers = {}) {
  const budget = Number(answers.exactBudget);
  if (!(budget > 0)) return "tight";
  if (answers.includedBudgetCategories && answers.includedBudgetCategories.hotel === false) return "middle";
  const nights = DURATION_NIGHTS[answers.duration] || 7;
  const perNight = (budget * 0.4) / nights;
  return perNight < 45 ? "tight" : perNight < 120 ? "middle" : "roomy";
}

