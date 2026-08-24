export function itineraryPreviewDays(itinerary, limit = 3) {
  const days = Array.isArray(itinerary?.days) ? itinerary.days : [];
  return days.slice(0, Math.max(0, limit));
}

export function serializeRecommendation({ travelerProfile, destination, budgetPlan, hotels = [], selectedHotel = null, itinerary = null, bookingLinks = {} }) {
  return {
    version: 2,
    travelerProfile,
    destination: { id: destination.id || destination.airport, airport: destination.airport, city: destination.city, country: destination.country },
    exactBudget: travelerProfile.exactBudget,
    includedBudgetCategories: travelerProfile.includedBudgetCategories,
    hotelSelection: selectedHotel,
    hotelAlternatives: hotels.slice(0, 3),
    estimatedCosts: budgetPlan,
    costConfidence: budgetPlan.confidence,
    itinerary,
    bookingLinks,
    providerIds: { hotel: selectedHotel?.providerPropertyId || null },
    generatedAt: new Date().toISOString(),
  };
}

export function buildTripEmailModel(savedTrip) {
  return {
    destination: savedTrip.destination,
    dates: savedTrip.travelerProfile?.dates || null,
    travelers: savedTrip.travelerProfile?.travelers || null,
    exactBudget: savedTrip.exactBudget || savedTrip.travelerProfile?.exactBudget || null,
    hotel: savedTrip.selections?.hotel || savedTrip.hotelSelection || null,
    restaurants: savedTrip.selections?.restaurants || [],
    activities: savedTrip.selections?.activities || [],
    estimatedCostBreakdown: savedTrip.estimatedCosts || null,
    itinerary: savedTrip.itinerary || null,
    journey: savedTrip.journey || null,
    bookingLinks: savedTrip.bookingLinks || {},
    disclaimer: "Prices shown are estimates unless a provider explicitly marks them live. Confirm final prices and availability with the provider.",
  };
}
