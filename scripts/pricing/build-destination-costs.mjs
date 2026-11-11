// Destination daily costs built from observed local prices, with the model
// and its measured error written next to every number.
//
//   meals      observed: Google Maps per-person ranges at local restaurants
//              (app/data/pricing/mealPrices.json)
//   inputs     the cheaper-quarter meal price there, and the country's price
//              level (World Bank, app/data/pricing/priceLevels.json)
//   lodging    modeled: log-linear fits of hand-observed Booking.com dorm
//              beds (cheapStays.js) and editorial budget-hotel nights against
//              those two inputs; never a specific property's price
//   food/day   modeled the same way against the editorial food days; the
//              comfortable level is built from observed meals (breakfast at
//              half a typical meal, a typical meal and an upper-quarter meal)
//   activities observed: median listed WeGoTrip price where 4+ products are
//              listed; otherwise left to the existing model
// Each fit is checked by leave-one-out: refit without a destination, predict
// it, compare. Those errors are stored in "validation".
//
// Usage: node scripts/pricing/build-destination-costs.mjs
//   → app/data/pricing/destinationCosts.json (small; safe for the browser)
import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";

const { destinations } = await import("../../app/data/destinations.js");
const { CHEAP_STAYS } = await import("../../app/data/cheapStays.js");
const { usdRate } = await import("../../app/lib/pricing/aggregate.js");
const read = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const meals = await read("../../app/data/pricing/mealPrices.json");
const levels = await read("../../app/data/pricing/priceLevels.json");
const airports = await read("../../app/data/airports.json");
const COUNTRY_OF = Object.fromEntries(airports.map((airport) => [airport.code, airport.country]));
const activityLines = gunzipSync(await readFile(new URL("../../data/price-observations/activities.ndjson.gz", import.meta.url))).toString("utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));

const median = (values) => { const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; };
const round = (value) => Math.max(1, Math.round(value));

// Ordinary least squares via the normal equations (two or three columns).
function ols(X, y) {
  const n = X[0].length;
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => X.reduce((sum, row) => sum + row[i] * row[j], 0)));
  const b = Array.from({ length: n }, (_, i) => X.reduce((sum, row, k) => sum + row[i] * y[k], 0));
  for (let i = 0; i < n; i += 1) {
    for (let r = i + 1; r < n; r += 1) { const f = A[r][i] / A[i][i]; for (let c = i; c < n; c += 1) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i -= 1) x[i] = (b[i] - A[i].slice(i + 1).reduce((sum, value, k) => sum + value * x[i + 1 + k], 0)) / A[i][i];
  return x;
}
const features = (input) => [1, Math.log(input.level), Math.log(input.meal)];
const fit = (points) => ols(points.map((point) => features(point)), points.map((point) => Math.log(point.y)));
const predict = (beta, input) => Math.exp(features(input).reduce((sum, value, k) => sum + value * beta[k], 0));
function validate(points) {
  const errors = points.map((point, index) => Math.abs(predict(fit(points.filter((_, other) => other !== index)), point) - point.y) / point.y);
  return { samples: points.length, medianAbsPctError: Number((median(errors) * 100).toFixed(1)), meanAbsPctError: Number((errors.reduce((sum, value) => sum + value, 0) / errors.length * 100).toFixed(1)), within30Pct: errors.filter((value) => value <= 0.3).length };
}

const byId = Object.fromEntries(destinations.map((destination) => [destination.id, destination]));
const inputs = (destination) => {
  const meal = meals.destinations[destination.id];
  const level = levels.countries[COUNTRY_OF[destination.airport]]?.level;
  return meal?.enough && level && meal.budgetMealUsd > 0 ? { meal: meal.budgetMealUsd, level } : null;
};
const points = (target) => destinations.map((destination) => ({ ...inputs(destination), y: target(destination), id: destination.id })).filter((point) => point.meal && point.y);
const sets = {
  dormBed: { points: points((destination) => destination.airport !== "PSP" && CHEAP_STAYS[destination.airport]?.bedNight), against: "hand-observed cheapest well-rated dorm bed on Booking.com, per person per night, taxes included (cheapStays.js, Feb 2027 stays checked 2026-11-08)" },
  budgetRoom: { points: points((destination) => destination.budgetEditorial?.planning?.hotelNight), against: "editorial budget-hotel night per room (budgetEditorial)" },
  cheapestFoodDay: { points: points((destination) => CHEAP_STAYS[destination.airport]?.cheapFoodDay), against: "editorial cheapest food day (cheapStays.js)" },
  valueFoodDay: { points: points((destination) => destination.budgetEditorial?.planning?.foodDay), against: "editorial good-value food day (budgetEditorial)" },
};
const models = Object.fromEntries(Object.entries(sets).map(([name, set]) => [name, fit(set.points)]));
const validation = Object.fromEntries(Object.entries(sets).map(([name, set]) => [name, { against: set.against, ...validate(set.points) }]));

const activityPrices = {};
for (const [, destinationId, , price, currency, , , , ] of activityLines) {
  const rate = usdRate(currency, new Date().toISOString().slice(0, 10));
  if (rate) (activityPrices[destinationId] ||= []).push(price * rate);
}

const out = {};
for (const destination of destinations) {
  const input = inputs(destination);
  if (!input) continue;
  const meal = meals.destinations[destination.id];
  const tours = activityPrices[destination.id] || [];
  out[destination.id] = {
    checkedAt: meal.checkedAt,
    restaurants: meal.restaurants,
    priceLevel: input.level,
    meal: { budget: meal.budgetMealUsd, typical: meal.typicalMealUsd, upper: meal.upperMealUsd },
    foodDay: {
      cheapest: round(predict(models.cheapestFoodDay, input)),
      value: round(predict(models.valueFoodDay, input)),
      comfortable: round(meal.typicalMealUsd * 1.5 + meal.upperMealUsd),
    },
    lodging: { dormBed: round(predict(models.dormBed, input)), budgetRoom: round(predict(models.budgetRoom, input)) },
    activity: tours.length >= 4 ? { medianListedUsd: round(median(tours)), products: tours.length } : null,
  };
}
await writeFile(new URL("../../app/data/pricing/destinationCosts.json", import.meta.url), `${JSON.stringify({ checkedAt: meals.checkedAt, inputs: ["log(country price level, World Bank)", "log(cheaper-quarter restaurant meal, Google Maps)"], models, validation, destinations: out })}\n`);
console.log(JSON.stringify(validation, null, 1));
console.log("destinations", Object.keys(out).length, "with activity prices", Object.values(out).filter((item) => item.activity).length);
for (const id of ["LIS", "HAN", "BKK", "las-vegas-76868", "KIX", "HND", "MLE"]) if (out[id]) console.log(id, JSON.stringify(out[id].lodging), JSON.stringify(out[id].foodDay));
