const UPDATED = "2026-08-14";

const TIERS = {
  value: { hotel: [90, 190], food: [30, 65], activities: [15, 45], transportation: [8, 25] },
  moderate: { hotel: [150, 300], food: [50, 100], activities: [25, 70], transportation: [15, 40] },
  expensive: { hotel: [240, 520], food: [75, 150], activities: [40, 110], transportation: [25, 70] },
  resort: { hotel: [380, 900], food: [100, 220], activities: [60, 180], transportation: [40, 130] },
};

const DESTINATION_TIERS = {
  "BANGKOK": "value", "CHIANG MAI": "value", "HANOI": "value", "MEXICO CITY": "value", "BUENOS AIRES": "value",
  "KYOTO": "moderate", "SEOUL": "moderate", "BALI": "moderate", "CAPE TOWN": "moderate", "MARRAKECH": "moderate", "LISBON": "moderate", "RIO DE JANEIRO": "moderate", "COSTA RICA": "moderate", "VANCOUVER": "moderate",
  "TOKYO": "expensive", "SINGAPORE": "expensive", "DUBAI": "expensive", "PARIS": "expensive", "PROVENCE": "expensive", "ROME": "expensive", "FLORENCE": "expensive", "BARCELONA": "expensive", "ICELAND RING ROAD": "expensive", "LONDON": "expensive", "NEW YORK CITY": "expensive", "PATAGONIA": "expensive", "BANFF": "expensive", "SYDNEY": "expensive", "NEW ZEALAND SOUTH ISLAND": "expensive",
  "MALDIVES": "resort", "NAIROBI & THE MAASAI MARA": "resort", "AMALFI COAST": "resort", "SANTORINI": "resort", "TULUM": "resort", "MAUI": "resort", "TAHITI & MOOREA": "resort",
};

const PEAK_MONTHS = {
  "KYOTO": [3, 4, 11], "TOKYO": [3, 4], "PARIS": [6, 7], "PROVENCE": [6, 7, 8], "AMALFI COAST": [6, 7, 8], "SANTORINI": [6, 7, 8], "MALDIVES": [12, 1, 2, 3], "NEW YORK CITY": [12], "BANFF": [7, 8], "MAUI": [12, 1, 2, 6, 7], "TAHITI & MOOREA": [6, 7, 8],
};

const HIGH_MONTHS = [6, 7, 8, 12];

export function seasonFor(destination, profile) {
  const month = profile?.dates?.start ? new Date(`${profile.dates.start}T00:00:00Z`).getUTCMonth() + 1 : null;
  if (!month) return { level: "shoulder", multiplier: 1, confidence: 0.42 };
  if ((PEAK_MONTHS[destination.city] || []).includes(month)) return { level: "peak", multiplier: 1.3, confidence: 0.58 };
  if (HIGH_MONTHS.includes(month)) return { level: "high", multiplier: 1.14, confidence: 0.5 };
  if ([1, 2, 11].includes(month)) return { level: "low", multiplier: 0.88, confidence: 0.46 };
  return { level: "shoulder", multiplier: 1, confidence: 0.48 };
}

export function destinationCostProfile(destination) {
  if (destination.costProfile?.typicalHotelNightLow != null) {
    return {
      destinationId: destination.id || destination.airport,
      country: destination.country,
      currency: destination.currency || "USD",
      ...destination.costProfile,
      seasonality: destination.seasonality || {},
      typicalFlightMarkets: destination.typicalFlightMarkets || null,
      source: destination.costProfile.source || destination.costSource || "globtrek_estimate",
      lastUpdated: destination.costProfile.lastUpdated || destination.costLastUpdated || UPDATED,
      confidence: destination.costProfile.confidence ?? destination.costConfidence ?? 0.35,
    };
  }
  const tier = DESTINATION_TIERS[destination.city] || "moderate";
  const values = TIERS[tier];
  return {
    destinationId: destination.airport,
    country: destination.country,
    currency: "USD",
    typicalHotelNightLow: values.hotel[0],
    typicalHotelNightHigh: values.hotel[1],
    foodDailyLow: values.food[0],
    foodDailyHigh: values.food[1],
    activitiesDailyLow: values.activities[0],
    activitiesDailyHigh: values.activities[1],
    transportDailyLow: values.transportation[0],
    transportDailyHigh: values.transportation[1],
    costTier: tier,
    seasonality: { peakMonths: PEAK_MONTHS[destination.city] || [], highMonths: HIGH_MONTHS },
    typicalFlightMarkets: null,
    source: "globtrek_editorial_estimate",
    lastUpdated: UPDATED,
    confidence: 0.45,
  };
}

export const destinationCostProfiles = Object.freeze({ DESTINATION_TIERS, TIERS });
