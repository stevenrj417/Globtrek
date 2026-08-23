export const roadTripQuestions = Object.freeze([
  { id: "landscape", eyebrow: "The view", title: "What landscape calls to you?", options: ["Coastline", "Forest", "Mountains", "Desert", "Countryside", "Lakes", "Cities"] },
  { id: "distance", eyebrow: "The distance", title: "How far do you want to wander?", options: ["Weekend escape", "500 miles", "1,000 miles", "2,000+ miles", "Custom distance"] },
  { id: "kind", eyebrow: "The journey", title: "What kind of road trip?", options: ["Slow scenic journey", "Adventure route", "Food and culture", "National parks", "Luxury escape", "Hidden places"] },
  { id: "driving", eyebrow: "The rhythm", title: "How do you like to drive?", options: ["Short drives, more stops", "Balanced", "Long driving days"] },
  { id: "travelers", eyebrow: "The company", title: "Who is coming along?", options: ["Solo", "Couple", "Friends", "Family"] },
  { id: "budget", eyebrow: "The budget", title: "What should the whole journey fit?", options: [] },
]);

const travelerCounts = { Solo: 1, Couple: 2, Friends: 4, Family: 4 };

export function roadTripTravelerCount(answers = {}) { return travelerCounts[answers.travelers] || 2; }

export function roadTripQuizForRecommendations(answers = {}) {
  const calm = answers.driving === "Short drives, more stops";
  const energetic = answers.driving === "Long driving days" || answers.kind === "Adventure route";
  return {
    guestCount: String(roadTripTravelerCount(answers)), exactBudget: Number(answers.budget) || null, budgetMode: "under",
    budgetIncludesFlights: false, budgetIncludesHotel: true, budgetIncludesFood: true, budgetIncludesActivities: true, budgetIncludesTransportation: true,
    answers: {
      self: answers.travelers,
      escape: calm ? "Slow mornings" : energetic ? "Packed schedule" : "Balanced days",
      luxury: answers.kind === "Luxury escape" ? "Premium" : answers.kind === "Hidden places" ? "Local culture" : "Nature",
      exactBudget: Number(answers.budget) || null,
    },
  };
}
