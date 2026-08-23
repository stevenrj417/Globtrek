function normalize(value) { return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\binternational\b|\bairport\b|\bregional\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim(); }

export function matchAirportPlaces(places = [], airports = []) {
  const candidates = [];
  for (const place of places) {
    const placeName = normalize(place.displayName?.text);
    const address = normalize(place.formattedAddress);
    for (const airport of airports) {
      const name = normalize(airport.name);
      const city = normalize(airport.city);
      let score = 0;
      if (name && placeName === name) score += 100;
      else if (name && (placeName.includes(name) || name.includes(placeName))) score += 70;
      if (city && (placeName.includes(city) || address.includes(city))) score += 20;
      if (new RegExp(`\\b${String(airport.code).toLowerCase()}\\b`).test(`${placeName} ${address}`)) score += 80;
      if (airport.scheduled) score += 5;
      if (score >= 75) candidates.push({ airport, score });
    }
  }
  return candidates.sort((a, b) => b.score - a.score || Number(b.airport.scheduled) - Number(a.airport.scheduled))[0]?.airport || null;
}
