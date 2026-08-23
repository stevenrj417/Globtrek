function component(place, type) { return place.addressComponents?.find((item) => item.types?.includes(type)) || null; }

export function normalizeLocationPlace(place, { airportCode = null } = {}) {
  const latitude = Number(place.location?.latitude);
  const longitude = Number(place.location?.longitude);
  if (!place.id || !place.displayName?.text || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const country = component(place, "country");
  const city = component(place, "locality") || component(place, "postal_town") || component(place, "administrative_area_level_2");
  const isAirport = Boolean(airportCode || place.types?.includes("airport"));
  const isAddress = place.types?.some((type) => ["street_address", "premise", "route", "postal_code"].includes(type));
  return {
    type: isAirport ? "airport" : isAddress ? "address" : "city",
    placeId: place.id,
    city: isAirport ? (city?.longText || place.displayName.text.replace(/\s+(International|Regional)?\s*Airport.*$/i, "").trim()) : isAddress ? (city?.longText || place.displayName.text) : place.displayName.text,
    countryCode: country?.shortText || null,
    countryName: country?.longText || null,
    latitude,
    longitude,
    airportCode: airportCode || null,
    airportName: isAirport ? place.displayName.text : null,
    formattedAddress: place.formattedAddress || null,
    googleMapsUri: place.googleMapsUri || null,
    verificationSource: "google_places",
  };
}
