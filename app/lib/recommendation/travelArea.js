import airports from "../../data/airports.json" with { type: "json" };

import { TRAVEL_AREA_OPTIONS } from "./travelAreaOptions.js";

const airportByCode = new Map(airports.map((airport) => [airport.code, airport]));
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const destinationCountryOverrides = new Map([["PATAGONIA", ["AR", "CL"]]]);

export { TRAVEL_AREA_OPTIONS };

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

// Number(null) and Number("") are 0; a missing coordinate must stay missing.
const finiteOrNull = (value) => (value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value));

export function originFromTrip(input = {}) {
  if (input.originDetails?.city && input.originDetails?.countryCode) return {
    type: input.originDetails.type || (input.originDetails.airportCode ? "airport" : "city"),
    placeId: input.originDetails.placeId || null,
    airportCode: input.originDetails.airportCode || null,
    airportName: input.originDetails.airportName || null,
    city: input.originDetails.city,
    countryCode: input.originDetails.countryCode,
    countryName: input.originDetails.countryName || regionNames.of(input.originDetails.countryCode) || input.originDetails.countryCode,
    latitude: finiteOrNull(input.originDetails.latitude),
    longitude: finiteOrNull(input.originDetails.longitude),
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

export function destinationUsesOriginAirport(destination = {}, profile = {}) {
  const originAirport = String(profile.originDetails?.airportCode || profile.origin || "").trim().toUpperCase();
  if (!originAirport) return false;
  const destinationAirports = new Set([destination.airport, ...(destination.primaryAirportCodes || [])]
    .map((code) => String(code || "").trim().toUpperCase())
    .filter(Boolean));
  return destinationAirports.has(originAirport);
}

export function destinationMatchesTravelArea(destination, profile = {}) {
  if (destinationUsesOriginAirport(destination, profile)) return false;
  const preference = normalizeTravelArea(profile.travelAreaPreference);
  if (preference === "anywhere" || !profile.originCountryCode) return true;
  const isDomestic = destinationCountryCodes(destination).includes(profile.originCountryCode);
  return preference === "domestic" ? isDomestic : !isDomestic;
}
