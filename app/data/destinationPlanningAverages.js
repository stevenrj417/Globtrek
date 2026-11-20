import destinationCosts from "./pricing/destinationCosts.json" with { type: "json" };
import feedStayCounts from "./feedStayCounts.json" with { type: "json" };
import lodgingBands from "./lodgingPriceBands.json" with { type: "json" };
import destinationMonthFactors from "./pricing/monthFactors.json" with { type: "json" };
import perDiemLodging from "./pricing/perDiemLodging.json" with { type: "json" };
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
export const RESORT_ECONOMIES = new Set(["MLE", "seychelles-3d2d7", "OGG", "PPT", "bora-bora-40f39", "st-barts-e3772"]);
export function localPrices(destination) {
  const local = destinationCosts.destinations[destination.id];
  if (!local) return null;
  if (LOCAL_TYPES.has(destination.destinationType || "city")) return local;
  if (RESORT_ECONOMIES.has(destination.id)) return null;
  return (feedStayCounts.budget?.[destination.id] || 0) >= MIN_BUDGET_STAYS ? { ...local, area: true } : null;
}

// The master destination list's typical nightly prices (lodgingPriceBands.json)
// are regional bands shared by many places, so they come after observed and
// modeled local prices, and never for resort economies, whose band is far
// below what their resorts charge.
export function priceBand(destination) {
  if (RESORT_ECONOMIES.has(destination.id)) return null;
  return lodgingBands.bands[destination.id] || null;
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

// Government per diem lodging (scripts/pricing/fetch-per-diem-lodging.mjs): the
// published most-allowed nightly rate for a business-standard hotel, by month,
// from GSA in the US and the State Department abroad. Matched to the city's own
// rate area, or the country's "Other" row / the state's standard rate.
export function perDiemFor(destination) {
  const rate = perDiemLodging[destination.id || destination.airport];
  return rate?.lodgingByMonth?.length === 12 ? rate : null;
}

// GlobTrek's hand-reviewed budgets for 14 US cities put a clean, well-reviewed
// budget room at a median 0.54 of that city's GSA lodging rate (most between 0.46
// and 0.68). US places without a reviewed budget price their room this way, month
// by month. Abroad the ratio swings with the country (0.16 to 0.39), so it is not used.
export const GSA_BUDGET_ROOM_RATIO = 0.54;
const gsaRoom = (rate) => (rate?.source === "gsa" && rate.matchType === "rate_area" ? rate.lodgingByMonth.map((night) => Math.round(night * GSA_BUDGET_ROOM_RATIO)) : null);

const PER_DIEM_SOURCE = { gsa: "U.S. General Services Administration (GSA) lodging rate", state_department: "U.S. State Department lodging rate" };

// A city's own per diem rate that changes through the year is a published
// seasonal price: it shapes the month-to-month swing ahead of the climate model.
function perDiemShape(rate) {
  if (!rate || rate.matchType !== "city" && rate.matchType !== "rate_area") return null;
  const nights = rate.lodgingByMonth;
  if (new Set(nights).size < 2) return null;
  const mean = nights.reduce((sum, value) => sum + value, 0) / 12;
  return nights.map((value) => value / mean);
}

function monthFactors(destination) {
  const published = perDiemShape(perDiemFor(destination));
  if (published) return published;
  const own = destinationMonthFactors.destinations?.[destination.id]?.factors;
  if (own?.length === 12) return own;
  if (destination.climateProfile?.zone === "tropical") return TROPICAL_MONTH_FACTORS;
  return destination.seasonality?.hemisphere === "southern" ? SOUTHERN_MONTH_FACTORS : NORTHERN_MONTH_FACTORS;
}

function perDiemPeaks(nights, pick) {
  const target = pick(...nights);
  return nights.map((value, index) => (value === target ? MONTH_NAMES[index].slice(0, 3) : null)).filter(Boolean);
}

export function buildDestinationPlanningAverages(destination = {}) {
  const level = destination.typicalCostLevel || "moderate";
  const fallback = COST_LEVELS[level] || COST_LEVELS.moderate;
  const profile = destination.costProfile || {};
  const editorial = destination.budgetEditorial?.planning || CITY_OVERRIDES[destination.city] || null;
  const local = editorial ? null : localPrices(destination);
  const band = editorial || local ? null : priceBand(destination);
  // With a band, food and activities still come from observed local prices.
  const meals = band ? destinationCosts.destinations[destination.id] || null : null;
  const city = editorial || (local ? { hotelNight: local.lodging.budgetRoom, foodDay: local.foodDay.value, activitiesDay: local.activity?.medianListedUsd }
    : band ? { hotelNight: band.budgetHotel ?? undefined, foodDay: meals?.foodDay.value, activitiesDay: meals?.activity?.medianListedUsd } : {});
  const baseline = {
    hotelNight: city.hotelNight ?? goodValueAverage(profile.typicalHotelNightLow, profile.typicalHotelNightHigh, fallback.hotelNight),
    foodDay: city.foodDay ?? goodValueAverage(profile.foodDailyLow, profile.foodDailyHigh, fallback.foodDay),
    activitiesDay: city.activitiesDay ?? goodValueAverage(profile.activitiesDailyLow, profile.activitiesDailyHigh, fallback.activitiesDay),
    localTransportDay: city.localTransportDay ?? goodValueAverage(profile.transportDailyLow, profile.transportDailyHigh, fallback.localTransportDay),
  };
  const factors = monthFactors(destination);
  const perDiem = perDiemFor(destination);
  const shaped = Boolean(perDiemShape(perDiem));
  const usRoom = editorial ? null : gsaRoom(perDiem);
  return {
    currency: "USD",
    hotelStandard: "Clean, well-reviewed budget hotel or simple three-star",
    basis: usRoom
      ? `Room: ${Math.round(GSA_BUDGET_ROOM_RATIO * 100)}% of the GSA lodging rate for ${perDiem.area} each month, the share GlobTrek's reviewed US city budgets pay for a good-value room.${local ? ` Food modeled from ${local.restaurants} local restaurants' price ranges on Google Maps (checked ${local.checkedAt}).` : ""} Not a live quote.`
      : local
      ? `Modeled from ${local.restaurants} local restaurants' price ranges on Google Maps (checked ${local.checkedAt}) and the country price level (World Bank); typical error about ${local.area ? `${AREA_LODGING_ERROR_PCT}% for lodging outside cities` : "20%"}. Not a live quote.`
      : band
        ? `Lodging: typical nightly price for a well-reviewed budget hotel, an estimated yearly average for a regional price band shared by ${band.sharedBy} places on GlobTrek's destination list.${meals ? ` Food modeled from ${meals.restaurants} local restaurants' price ranges on Google Maps (checked ${meals.checkedAt}).` : ""} Not a live quote.`
        : RESORT_ECONOMIES.has(destination.id)
          ? "Modeled good-value planning average. Resort prices here often run far higher; check live rates before you budget. Not a live quote."
          : "Modeled good-value planning average; not a live quote or guaranteed price",
    // "city": an editorial city baseline; "local_prices": modeled from observed
    // local prices; "price_band": regional lodging band plus observed local
    // meal prices; "price_band_partial": the band without local meal prices;
    // "tier": a price-tier default only.
    // "us_lodging_rate": the room from the GSA rate (see GSA_BUDGET_ROOM_RATIO).
    model: editorial ? "city" : usRoom ? "us_lodging_rate" : local ? "local_prices" : band ? (meals ? "price_band" : "price_band_partial") : "tier",
    lodgingBand: band,
    localPrices: local ? { checkedAt: local.checkedAt, restaurants: local.restaurants, meal: local.meal, foodDay: local.foodDay, lodging: local.lodging, activity: local.activity } : null,
    airportTransferPerPerson: Number(city.airportTransferPerPerson) || 0,
    lodgingTaxRate: Number(city.lodgingTaxRate) || 0,
    costLevel: level,
    source: usRoom ? "globtrek_gsa_lodging_rate_v1" : local ? "globtrek_local_prices_v1" : band ? "globtrek_destination_list_price_band" : profile.source || "globtrek_city_budget_baseline_v1",
    confidence: usRoom ? 0.5 : local ? (local.area ? 0.4 : 0.5) : band ? 0.3 : Math.max(0.3, Number(profile.confidence) || 0.4),
    // Month-to-month swing modeled from this place's own weather and holiday months
    // (scripts/pricing/build-month-factors.mjs), when its climate is on file.
    // The standard-hotel rate is shown beside the good-value room; in the US it is
    // also the comfortable traveler's room (GSA sets it from mid-range hotels).
    standardHotel: perDiem ? { source: perDiem.source, label: PER_DIEM_SOURCE[perDiem.source], area: perDiem.area, matchType: perDiem.matchType, checkedAt: perDiem.fetchedAt } : null,
    seasonality: shaped ? { source: "government_lodging_rates", peakMonths: perDiemPeaks(perDiem.lodgingByMonth, Math.max), cheapestMonths: perDiemPeaks(perDiem.lodgingByMonth, Math.min) } : destinationMonthFactors.destinations?.[destination.id] ? { source: "local_climate_model", peakMonths: destinationMonthFactors.destinations[destination.id].peakMonths, cheapestMonths: destinationMonthFactors.destinations[destination.id].cheapestMonths } : { source: "hemisphere_curve" },
    monthly: MONTH_NAMES.map((monthName, index) => ({
      month: index + 1,
      monthName,
      hotelNight: usRoom ? usRoom[index] : roundMoney(baseline.hotelNight * factors[index]),
      foodPerPersonDay: baseline.foodDay,
      activitiesPerPersonDay: baseline.activitiesDay,
      localTransportDay: baseline.localTransportDay,
      ...(perDiem ? { standardHotelNight: perDiem.lodgingByMonth[index] } : {}),
    })),
  };
}

export { MONTH_NAMES };
