// Server only: fetch round-trip fare observations from one origin (Aviasales
// Data API, fares travelers found in the last days) in observation shape.
import flightPrices from "../../data/flightPrices.json" with { type: "json" };
import { latestPrices } from "../travelpayouts/client.js";

const US_ORIGINS = [...new Set(Object.keys(flightPrices.routes).map((key) => key.split(":")[0]))];
const WORLD_ORIGINS = "LHR LGW MAN DUB CDG AMS FRA MUC MAD BCN FCO MXP ZRH VIE CPH ARN OSL HEL WAW PRG BUD IST DXB DOH DEL BOM SIN BKK HKG ICN NRT HND KIX TPE MNL KUL SYD MEL AKL YYZ YVR YUL YYC MEX GDL CUN BOG LIM SCL EZE GRU JNB CPT CAI NBO".split(" ");
export const FARE_ORIGINS = Object.freeze([...US_ORIGINS, ...WORLD_ORIGINS]);

export async function collectOriginFares({ token, origin, pages = 2, fetchImpl }) {
  const rows = [];
  const errors = [];
  for (let page = 1; page <= pages; page += 1) {
    try {
      const fares = await latestPrices({ token, fetchImpl, origin, periodType: "year", oneWay: false, limit: 1000, page, affiliateOnly: false });
      for (const fare of fares) {
        if (!fare.roundTrip || !fare.departDate || !fare.returnDate || !fare.foundAt || fare.currency !== "USD") continue;
        rows.push({
          kind: "flight",
          itemId: `${fare.originAirport || origin}-${fare.destinationAirport}`,
          origin: fare.originAirport || origin,
          destination: fare.destinationAirport,
          provider: "aviasales",
          source: "aviasales_data_api_v3_get_latest_prices",
          observedAt: fare.foundAt.slice(0, 10),
          travelDate: fare.departDate,
          travelEnd: fare.returnDate,
          price: fare.pricePerPerson,
          currency: fare.currency,
          unit: "per_passenger_round_trip",
          taxesIncluded: true,
          conditions: { cabin: "economy", stops: fare.stops, airline: fare.airline, durationMinutes: fare.durationMinutes },
        });
      }
      if (fares.length < 1000) break;
    } catch (error) {
      errors.push({ page, error: error?.code || "failed" });
      break;
    }
  }
  return { rows, errors };
}
