import destinationCosts from "./pricing/destinationCosts.json" with { type: "json" };
import feedStayCounts from "./feedStayCounts.json" with { type: "json" };
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

// Daily costs from observed local prices (scripts/pricing/build-destination-costs.mjs):
// food and lodging modeled from local restaurant prices and the country price
// level, checked against observed hostel prices and editorial budgets. Used for
// city destinations without an editorial budget; the model was fit on cities,
// so islands, resorts and multi-stop regions only use it when the Booking.com
// catalog shows real budget lodging there (three or more hostels, simple guest
// houses or two-star hotels). Checked against the seven non-city places with
// editorial budgets, the city lodging fit is off by a median 31% there (20%
// in cities), so those estimates carry less confidence. Places with only
// upscale stays (many resort islands) keep the price-tier default.
const LOCAL_TYPES = new Set(["city"]);
export const MIN_BUDGET_STAYS = 3;
export const AREA_LODGING_ERROR_PCT = 31;
// Island economies where visitor prices are set by resort tourism, far above
// the local price level the model learns from (the model gives the Seychelles
// a $53 room and the Maldives a $49 one). They wait for real property prices.
const RESORT_ECONOMIES = new Set(["MLE", "seychelles-3d2d7", "OGG", "PPT", "bora-bora-40f39", "st-barts-e3772"]);
export function localPrices(destination) {
  const local = destinationCosts.destinations[destination.id];
  if (!local) return null;
  if (LOCAL_TYPES.has(destination.destinationType || "city")) return local;
  if (RESORT_ECONOMIES.has(destination.id)) return null;
  return (feedStayCounts.budget?.[destination.id] || 0) >= MIN_BUDGET_STAYS ? { ...local, area: true } : null;
}

function roundMoney(value) {
  return Math.max(1, Math.round(value));
}

function goodValueAverage(low, high, fallback) {
  const minimum = Number(low);
  const maximum = Number(high);
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum < minimum) return fallback;
  // Stay close to the grounded low end: the product is modeling a clean,
  // well-reviewed budget choice, not the midpoint of the whole hotel market.
  return roundMoney(minimum + (maximum - minimum) * 0.05);
}

function monthFactors(destination) {
  if (destination.climateProfile?.zone === "tropical") return TROPICAL_MONTH_FACTORS;
  return destination.seasonality?.hemisphere === "southern" ? SOUTHERN_MONTH_FACTORS : NORTHERN_MONTH_FACTORS;
}

export function buildDestinationPlanningAverages(destination = {}) {
  const level = destination.typicalCostLevel || "moderate";
  const fallback = COST_LEVELS[level] || COST_LEVELS.moderate;
  const profile = destination.costProfile || {};
  const editorial = destination.budgetEditorial?.planning || CITY_OVERRIDES[destination.city] || null;
  const local = editorial ? null : localPrices(destination);
  const city = editorial || (local ? { hotelNight: local.lodging.budgetRoom, foodDay: local.foodDay.value, activitiesDay: local.activity?.medianListedUsd } : {});
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
    basis: local
      ? `Modeled from ${local.restaurants} local restaurants' price ranges on Google Maps (checked ${local.checkedAt}) and the country price level (World Bank); typical error about ${local.area ? `${AREA_LODGING_ERROR_PCT}% for lodging outside cities` : "20%"}. Not a live quote.`
      : "Modeled good-value planning average; not a live quote or guaranteed price",
    // "city": an editorial city baseline; "local_prices": modeled from observed
    // local prices; "tier": a price-tier default only.
    model: editorial ? "city" : local ? "local_prices" : "tier",
    localPrices: local ? { checkedAt: local.checkedAt, restaurants: local.restaurants, meal: local.meal, foodDay: local.foodDay, lodging: local.lodging, activity: local.activity } : null,
    airportTransferPerPerson: Number(city.airportTransferPerPerson) || 0,
    lodgingTaxRate: Number(city.lodgingTaxRate) || 0,
    costLevel: level,
    source: local ? "globtrek_local_prices_v1" : profile.source || "globtrek_city_budget_baseline_v1",
    confidence: local ? (local.area ? 0.4 : 0.5) : Math.max(0.3, Number(profile.confidence) || 0.4),
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
