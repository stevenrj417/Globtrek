import airports from "../../data/airports.json" with { type: "json" };

const airportByCode = new Map(airports.map((airport) => [airport.code, airport]));
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const destinationCountryOverrides = new Map([["PATAGONIA", ["AR", "CL"]]]);

export const TRAVEL_AREA_OPTIONS = Object.freeze([
  { value: "anywhere", label: "Anywhere" },
  { value: "domestic", label: "Stay in my country" },
  { value: "international", label: "International only" },
]);

export function normalizeTravelArea(value) {
  return TRAVEL_AREA_OPTIONS.some((option) => option.value === value) ? value : "anywhere";
}

export function airportByIata(value) {
  const code = String(value || "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? airportByCode.get(code) || null : null;
}

export function structuredOrigin(value) {
  const code = typeof value === "object" && value ? value.code || value.airportCode : value;
  const airport = airportByIata(code);
  if (!airport) return null;
  return {
    type: "airport",
    airportCode: airport.code,
    airportName: airport.name,
    city: airport.city,
    countryCode: airport.country,
    countryName: regionNames.of(airport.country) || airport.country,
  };
}

export function originFromTrip(input = {}) {
  if (input.originDetails?.city && input.originDetails?.countryCode) return {
    type: input.originDetails.type || (input.originDetails.airportCode ? "airport" : "city"),
    placeId: input.originDetails.placeId || null,
    airportCode: input.originDetails.airportCode || null,
    airportName: input.originDetails.airportName || null,
    city: input.originDetails.city,
    countryCode: input.originDetails.countryCode,
    countryName: input.originDetails.countryName || regionNames.of(input.originDetails.countryCode) || input.originDetails.countryCode,
    latitude: Number.isFinite(Number(input.originDetails.latitude)) ? Number(input.originDetails.latitude) : null,
    longitude: Number.isFinite(Number(input.originDetails.longitude)) ? Number(input.originDetails.longitude) : null,
    formattedAddress: input.originDetails.formattedAddress || null,
    verificationSource: input.originDetails.verificationSource || null,
  };
  return structuredOrigin(input.originDetails || input.originAirport || input.origin);
}

export function destinationCountryCodes(destination = {}) {
  const override = destinationCountryOverrides.get(destination.city);
  if (override) return override;
  return [...new Set((destination.primaryAirportCodes || [destination.airport])
    .map((code) => airportByIata(code)?.country)
    .filter(Boolean))];
}

export function destinationMatchesTravelArea(destination, profile = {}) {
  const preference = normalizeTravelArea(profile.travelAreaPreference);
  if (preference === "anywhere" || !profile.originCountryCode) return true;
  const isDomestic = destinationCountryCodes(destination).includes(profile.originCountryCode);
  return preference === "domestic" ? isDomestic : !isDomestic;
}
