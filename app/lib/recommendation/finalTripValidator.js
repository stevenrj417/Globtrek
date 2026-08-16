export function validateTripRecommendation({ destination, travelerProfile, budgetPlan, itinerary, selectedHotel = null }) {
  const issues = [];
  if (!destination?.airport || !destination?.city || !destination?.country) issues.push({ code: "invalid_destination", severity: "error" });
  if (travelerProfile?.origin && destination?.travelFeasibility?.status === "unreasonable") issues.push({ code: "unreasonable_travel_time", severity: "error" });
  if (travelerProfile?.includedBudgetCategories?.flights && !budgetPlan?.flightEstimate) issues.push({ code: "missing_flight_estimate", severity: "error" });
  if (budgetPlan?.targetBudget > 0 && budgetPlan.withinHardBudget === false) issues.push({ code: "over_exact_budget", severity: "error", target: budgetPlan.targetBudget, estimatedHigh: budgetPlan.estimatedTripHigh });
  if (selectedHotel && !selectedHotel.name) issues.push({ code: "invalid_hotel", severity: "error" });
  if (selectedHotel?.bookingUrl && !/^https:\/\//.test(selectedHotel.bookingUrl)) issues.push({ code: "invalid_hotel_booking_link", severity: "error" });
  const days = itinerary?.days;
  if (!Array.isArray(days) || days.length !== travelerProfile?.tripLength) issues.push({ code: "itinerary_length_mismatch", severity: "error", expected: travelerProfile?.tripLength, actual: days?.length || 0 });
  for (const [index, day] of (days || []).entries()) if (!day?.title || !day?.morning || !day?.afternoon || !day?.evening) issues.push({ code: "incomplete_itinerary_day", severity: "error", day: index + 1 });
  return { valid: !issues.some((issue) => issue.severity === "error"), issues, validatedAt: new Date().toISOString() };
}
