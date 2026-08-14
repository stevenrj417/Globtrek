const CATEGORY_INTERESTS = {
  food: ["Food"], culture: ["Culture"], museums: ["Culture"], nature: ["Nature", "Mountains", "Ocean"], adventure: ["Nature", "Adventure days"], wellness: ["Wellness", "Mostly relaxing"], nightlife: ["Nightlife"], shopping: ["Shopping"], architecture: ["Culture", "Cities"], beaches: ["Ocean"], water: ["Ocean"], day_trip: ["Road Trips", "Adventure days"], local: ["Culture", "Food"], luxury: ["Blowout", "Premium"], free: ["Smart value"],
};

function score(value, fallback = 50) { return Number.isFinite(Number(value)) ? Number(value) : fallback; }

export function rankActivities(activities, profile, budgetPlan, context = {}) {
  const activityAllowance = budgetPlan?.activitiesBudget?.high || 0;
  const perTravelerAllowance = activityAllowance / Math.max(1, profile.travelers);
  return activities.filter((item) => item.active !== false).map((item) => {
    const low = Number(item.estimatedCostLow);
    const high = Number(item.estimatedCostHigh);
    const priceKnown = Number.isFinite(low) && Number.isFinite(high);
    const midpoint = priceKnown ? (low + high) / 2 : null;
    const budgetFit = !profile.includedBudgetCategories.activities ? 70 : !priceKnown ? 52 : midpoint <= perTravelerAllowance ? 100 : Math.max(0, Math.round(100 - ((midpoint - perTravelerAllowance) / Math.max(1, perTravelerAllowance)) * 100));
    const interests = profile.interests.concat(Object.values(profile.otherExistingQuizPreferences || {}));
    const interestFit = (CATEGORY_INTERESTS[item.category] || []).some((interest) => interests.includes(interest)) ? 100 : 52;
    const relaxationTarget = profile.relaxationPreference === "high" ? 85 : profile.relaxationPreference === "low" ? 25 : 55;
    const relaxationFit = 100 - Math.abs(score(item.relaxationScore) - relaxationTarget);
    const desiredIconic = 100 - profile.unknownness;
    const unknownnessFit = 100 - Math.abs(score(item.iconicScore) - desiredIconic);
    const timeFit = !context.timeOfDay || !item.recommendedTimeOfDay?.length || item.recommendedTimeOfDay.includes(context.timeOfDay) ? 100 : 55;
    const activityMatchScore = Math.round(budgetFit * 0.3 + interestFit * 0.25 + relaxationFit * 0.17 + unknownnessFit * 0.18 + timeFit * 0.1);
    return { ...item, priceKnown, activityMatchScore, budgetFit, interestFit, unknownnessFit, timeFit };
  }).sort((a, b) => b.activityMatchScore - a.activityMatchScore || a.name.localeCompare(b.name));
}

export function shortlistActivities(activities, profile, budgetPlan, context = {}, limit = 6) {
  return rankActivities(activities, profile, budgetPlan, context).slice(0, limit);
}
