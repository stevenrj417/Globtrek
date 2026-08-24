export const cruiseQuestions = Object.freeze([
  { id: "experience", eyebrow: "The ocean", title: "What kind of ocean experience calls to you?", visual: true, options: ["Tropical islands", "Coastal cities", "Dramatic landscapes", "Remote exploration"] },
  { id: "mood", eyebrow: "The rhythm", title: "How do you want the days to feel?", options: ["Relaxed and slow", "Balanced exploring and relaxing", "Adventure every day", "Luxury escape"] },
  { id: "priority", eyebrow: "The experience", title: "What matters most?", options: ["Beautiful beaches", "Amazing food", "Historic cities", "Nature and wildlife", "Nightlife and entertainment", "Family experiences"] },
  { id: "region", eyebrow: "The direction", title: "Where should the journey lead?", options: ["Caribbean", "Mediterranean", "Alaska", "Northern Europe", "Asia Pacific", "No preference"] },
  { id: "waterType", eyebrow: "The water", title: "What kind of sailing?", options: ["Ocean", "River", "Either"] },
  { id: "season", eyebrow: "The season", title: "When should it feel right?", options: ["Winter", "Spring", "Summer", "Autumn", "Flexible"] },
  { id: "duration", eyebrow: "Time at sea", title: "How long?", options: ["3–5 nights", "6–8 nights", "9–14 nights", "15+ nights"] },
  { id: "budget", eyebrow: "The complete journey", title: "What should the whole trip cost?", options: [] },
  { id: "travelers", eyebrow: "Your company", title: "Who is traveling?", options: ["Couple", "Family", "Friends", "Solo"] },
  { id: "origin", eyebrow: "Getting there", title: "Where would you like to begin your journey?", options: [] },
]);

export function cruiseTravelerCount(answers = {}) { return ({ Couple: 2, Family: 4, Friends: 4, Solo: 1 })[answers.travelers] || 2; }

export function cruiseQuizForRecommendations(answers = {}) {
  const pace = answers.mood === "Relaxed and slow" ? "Mostly relaxing" : answers.mood === "Adventure every day" ? "Adventure days" : "Balanced days";
  const priority = ({ "Amazing food": "Food", "Historic cities": "Culture", "Nature and wildlife": "Nature", "Nightlife and entertainment": "Nightlife", "Beautiful beaches": "Nature", "Family experiences": "Family" })[answers.priority] || "Nature";
  return { exactBudget: Number(answers.budget), guestCount: cruiseTravelerCount(answers), origin: answers.originDetails?.airportCode, originDetails: answers.originDetails, escape: pace, luxury: priority, hotel: answers.mood === "Luxury escape" ? "Beach resort" : "Boutique hotel" };
}
