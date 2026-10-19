const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const COST_LEVELS = {
  value: { hotelNight: 75, foodDay: 35, activitiesDay: 18, localTransportDay: 10 },
  moderate: { hotelNight: 120, foodDay: 48, activitiesDay: 28, localTransportDay: 16 },
  expensive: { hotelNight: 190, foodDay: 65, activitiesDay: 38, localTransportDay: 24 },
  very_expensive: { hotelNight: 300, foodDay: 90, activitiesDay: 55, localTransportDay: 35 },
};

const CITY_OVERRIDES = {
  "MEXICO CITY": { hotelNight: 80, foodDay: 32, activitiesDay: 18, localTransportDay: 9 },
  HANOI: { hotelNight: 38, foodDay: 22, activitiesDay: 14, localTransportDay: 7 },
  LISBON: { hotelNight: 105, foodDay: 42, activitiesDay: 24, localTransportDay: 13 },
  BANGKOK: { hotelNight: 48, foodDay: 25, activitiesDay: 16, localTransportDay: 8 },
  "CHIANG MAI": { hotelNight: 38, foodDay: 22, activitiesDay: 14, localTransportDay: 7 },
  "BUENOS AIRES": { hotelNight: 58, foodDay: 30, activitiesDay: 17, localTransportDay: 8 },
};

const NORTHERN_MONTH_FACTORS = [0.9, 0.9, 0.96, 1, 1.04, 1.1, 1.15, 1.12, 1.02, 0.97, 0.94, 1.1];
const SOUTHERN_MONTH_FACTORS = [1.15, 1.1, 1.02, 0.97, 0.94, 0.9, 0.9, 0.92, 0.98, 1.02, 1.08, 1.15];
const TROPICAL_MONTH_FACTORS = [1.08, 1.06, 1, 0.96, 0.92, 0.9, 0.9, 0.92, 0.96, 1, 1.04, 1.1];

function roundMoney(value) {
  return Math.max(1, Math.round(value));
}

function goodValueAverage(low, high, fallback) {
  const minimum = Number(low);
  const maximum = Number(high);
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum < minimum) return fallback;
  return roundMoney(minimum + (maximum - minimum) * 0.15);
}

function monthFactors(destination) {
  if (destination.climateProfile?.zone === "tropical") return TROPICAL_MONTH_FACTORS;
  return destination.seasonality?.hemisphere === "southern" ? SOUTHERN_MONTH_FACTORS : NORTHERN_MONTH_FACTORS;
}

export function buildDestinationPlanningAverages(destination = {}) {
  const level = destination.typicalCostLevel || "moderate";
  const fallback = COST_LEVELS[level] || COST_LEVELS.moderate;
  const profile = destination.costProfile || {};
  const city = CITY_OVERRIDES[destination.city] || {};
  const baseline = {
    hotelNight: city.hotelNight ?? goodValueAverage(profile.typicalHotelNightLow, profile.typicalHotelNightHigh, fallback.hotelNight),
    foodDay: city.foodDay ?? goodValueAverage(profile.foodDailyLow, profile.foodDailyHigh, fallback.foodDay),
    activitiesDay: city.activitiesDay ?? goodValueAverage(profile.activitiesDailyLow, profile.activitiesDailyHigh, fallback.activitiesDay),
    localTransportDay: city.localTransportDay ?? goodValueAverage(profile.transportDailyLow, profile.transportDailyHigh, fallback.localTransportDay),
  };
  const factors = monthFactors(destination);
  return {
    currency: "USD",
    hotelStandard: "Clean, well-reviewed budget hotel or simple three-star",
    basis: "Modeled good-value planning average; not a live quote or guaranteed price",
    source: profile.source || "globtrek_city_budget_baseline_v1",
    confidence: Math.max(0.3, Number(profile.confidence) || 0.4),
    monthly: MONTH_NAMES.map((monthName, index) => ({
      month: index + 1,
      monthName,
      hotelNight: roundMoney(baseline.hotelNight * factors[index]),
      foodPerPersonDay: baseline.foodDay,
      activitiesPerPersonDay: baseline.activitiesDay,
      localTransportDay: baseline.localTransportDay,
    })),
  };
}

export { MONTH_NAMES };
