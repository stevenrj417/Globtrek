const STYLE_KEYS = Object.freeze(["luxury", "adventure", "relaxation", "culture", "food", "nature", "nightlife", "family", "romance"]);
const SAFE_IMAGE = /^https:\/\/(images\.unsplash\.com|upload\.wikimedia\.org|[^/]+\.googleusercontent\.com)\//i;

function finite(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)); }
function validHttps(value) { try { return new URL(value).protocol === "https:"; } catch { return false; } }
function dateNights(start, end) { return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000); }
function port(value) {
  const latitude = finite(value?.latitude); const longitude = finite(value?.longitude);
  if (!value?.name || !value?.country || latitude == null || longitude == null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { name: String(value.name), city: String(value.name), country: String(value.country), latitude, longitude, placeId: value.placeId || value.place_id || null, image: value.image || value.image_url || null };
}

export function normalizeCruiseRecord(row = {}) {
  const stops = (row.cruise_itinerary_stops || row.stops || []).toSorted((a, b) => Number(a.sequence_number ?? a.sequenceNumber) - Number(b.sequence_number ?? b.sequenceNumber)).map((stop) => {
    const stopType = stop.stop_type || stop.stopType;
    if (stopType === "sea_day") return { day: Number(stop.day_number || stop.day), sequence: Number(stop.sequence_number || stop.sequence), stopType: "sea_day", name: "At sea", city: "At sea", country: null, latitude: null, longitude: null, description: stop.description || null, image: null, placeId: null };
    const normalizedPort = port({ name: stop.port_name || stop.name, country: stop.country, latitude: stop.latitude, longitude: stop.longitude, placeId: stop.place_id || stop.placeId, image: stop.image_url || stop.image });
    return normalizedPort ? { ...normalizedPort, day: Number(stop.day_number || stop.day), sequence: Number(stop.sequence_number || stop.sequence), stopType: "port", description: stop.description || null } : null;
  }).filter(Boolean);
  const departurePort = port(row.departure_port || row.departurePort);
  const arrivalPort = port(row.arrival_port || row.arrivalPort);
  const duration = Number(row.duration_nights ?? row.durationNights);
  const price = finite(row.starting_price ?? row.startingPrice);
  const images = (row.image_urls || row.images || []).filter((url) => SAFE_IMAGE.test(url));
  const ready = Boolean(row.active && row.recommendation_ready && row.identity_verified && row.itinerary_verified && row.affiliate_url_verified);
  if (!row.id || !row.provider_cruise_id || !row.name || !row.cruise_line || !row.ship_name || !["ocean", "river", "expedition"].includes(row.cruise_type) || !row.region || !Number.isInteger(duration) || duration < 1 || !validDate(row.departure_date) || !validDate(row.return_date) || dateNights(row.departure_date, row.return_date) !== duration || !departurePort || !arrivalPort || price == null || price <= 0 || !row.currency || !validHttps(row.provider_url) || !validHttps(row.affiliate_url) || !ready || !stops.length || stops.filter((stop) => stop.stopType === "port").length < 2) return null;
  return {
    id: row.id, provider: row.provider, providerCruiseId: row.provider_cruise_id, name: row.name, cruiseLine: row.cruise_line, shipName: row.ship_name,
    cruiseType: row.cruise_type, region: row.region, durationNights: duration, departureDate: row.departure_date, returnDate: row.return_date,
    departurePort, arrivalPort, seaDays: Number(row.sea_days) || stops.filter((stop) => stop.stopType === "sea_day").length,
    startingPrice: price, currency: row.currency, priceBasis: row.price_basis, priceIsLive: Boolean(row.price_is_live), priceVerifiedAt: row.price_verified_at,
    cabinInformation: row.cabin_information || [], description: row.description || null, images, matchTags: row.match_tags || [], styleScores: row.style_scores || {},
    affiliatePath: `/api/cruises/outbound/${encodeURIComponent(row.id)}`, stops,
  };
}

export function cruiseProfile(answers = {}) {
  const scores = Object.fromEntries(STYLE_KEYS.map((key) => [key, 0]));
  const add = (key, value) => { scores[key] = Math.max(scores[key] || 0, value); };
  if (answers.mood === "Luxury escape") { add("luxury", 100); add("romance", 72); }
  if (answers.mood === "Adventure every day") add("adventure", 100);
  if (answers.mood === "Relaxed and slow") add("relaxation", 100);
  if (answers.mood === "Balanced exploring and relaxing") { add("relaxation", 65); add("adventure", 55); }
  const priority = { "Amazing food": "food", "Historic cities": "culture", "Nature and wildlife": "nature", "Nightlife and entertainment": "nightlife", "Family experiences": "family", "Beautiful beaches": "relaxation" }[answers.priority];
  if (priority) add(priority, 95);
  if (answers.travelers === "Couple") add("romance", 62);
  if (answers.travelers === "Family") add("family", 100);
  return { scores, budget: Number(answers.budget) || null, duration: answers.duration, region: answers.region === "No preference" ? null : answers.region || answers.experience || null, season: answers.season || "Flexible", cruiseType: answers.waterType === "River" ? "river" : answers.waterType === "Ocean" ? "ocean" : null, travelers: ({ Couple: 2, Family: 4, Friends: 4, Solo: 1 })[answers.travelers] || 2 };
}

function durationRange(label) { return ({ "3–5 nights": [3, 5], "6–8 nights": [6, 8], "9–14 nights": [9, 14], "15+ nights": [15, 180] })[label] || [1, 180]; }
function seasonMonths(season) { return ({ Winter: [12, 1, 2], Spring: [3, 4, 5], Summer: [6, 7, 8], Autumn: [9, 10, 11] })[season] || null; }
function titleCase(value) { return String(value || "").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()); }

export function rankCruises(cruises = [], answers = {}, accessCost = () => 0) {
  const profile = cruiseProfile(answers); const [minNights, maxNights] = durationRange(profile.duration); const allowedMonths = seasonMonths(profile.season);
  return cruises.map((cruise) => {
    let score = 25; const reasons = [];
    const styleEntries = STYLE_KEYS.map((key) => [key, Math.min(profile.scores[key] || 0, Number(cruise.styleScores?.[key]) || 0)]).filter(([, value]) => value > 0).toSorted((a, b) => b[1] - a[1]);
    const styleFit = styleEntries.length ? styleEntries.slice(0, 3).reduce((sum, [, value]) => sum + value, 0) / Math.min(3, styleEntries.length) : 0;
    score += styleFit * 0.48;
    if (styleEntries[0]) reasons.push(titleCase(styleEntries[0][0]));
    if (styleEntries[1]) reasons.push(titleCase(styleEntries[1][0]));
    if (cruise.durationNights >= minNights && cruise.durationNights <= maxNights) { score += 14; reasons.push(`${cruise.durationNights} nights`); } else score -= 16;
    if (!profile.cruiseType || cruise.cruiseType === profile.cruiseType) score += 8; else score -= 24;
    const departureMonth = Number(cruise.departureDate.slice(5, 7)); if (!allowedMonths || allowedMonths.includes(departureMonth)) score += 6; else score -= 12;
    const regionNeedle = String(profile.region || "").toLowerCase(); if (regionNeedle && `${cruise.region} ${cruise.matchTags.join(" ")}`.toLowerCase().includes(regionNeedle.split(" ")[0])) score += 10;
    const estimatedCruiseFare = cruise.startingPrice * profile.travelers; const estimatedKnownTotal = estimatedCruiseFare + Math.max(0, Number(accessCost(cruise)) || 0);
    const withinBudget = profile.budget == null || estimatedKnownTotal <= profile.budget; const nearBudget = profile.budget != null && estimatedKnownTotal <= profile.budget * 1.12;
    if (withinBudget) score += 26; else if (nearBudget) score += 2; else score -= 1_000;
    const matchPercent = Math.max(1, Math.min(99, Math.round(score)));
    return { ...cruise, matchPercent, matchReasons: reasons.slice(0, 3), estimatedCruiseFare, estimatedKnownTotal, budgetCompatibility: withinBudget ? "excellent" : nearBudget ? "acceptable" : "poor", score };
  }).filter((cruise) => cruise.budgetCompatibility !== "poor").toSorted((a, b) => b.score - a.score || a.estimatedKnownTotal - b.estimatedKnownTotal).slice(0, 3);
}

export function safeCruiseImage(value) { return SAFE_IMAGE.test(value || "") ? value : null; }
