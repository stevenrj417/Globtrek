import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { Breadcrumb } from "../../components/TravelPage";
import { BookItPanel } from "../../components/BookItPanel";
import { airportByCode } from "../../lib/anyplace/airport";
import { countryName } from "../../lib/search/country";
import fares from "../../data/flightPrices.json" with { type: "json" };

export const revalidate = 86400;

const ROUTE = /^([A-Z]{3})-([A-Z]{3})$/;

function parse(route) {
  const match = ROUTE.exec(String(route || "").toUpperCase());
  if (!match || match[1] === match[2]) return null;
  const from = airportByCode(match[1]);
  const to = airportByCode(match[2], from ? { latitude: from.latitude, longitude: from.longitude } : null);
  return from && to ? { from, to } : null;
}

// U.S. DOT's average fares for this airport pair (U.S. domestic routes only).
function dotFare(a, b) {
  const route = fares.routes[`${a}:${b}`] || fares.routes[`${b}:${a}`];
  if (!route) return null;
  const quarters = Object.values(route.quarters || {}).filter((quarter) => quarter?.fare);
  if (!quarters.length) return null;
  const average = Math.round(quarters.reduce((sum, quarter) => sum + quarter.fare, 0) / quarters.length);
  const low = Math.min(...quarters.map((quarter) => quarter.fareLow || quarter.fare));
  return { average, low };
}

const place = (airport) => [airport.city || airport.name, countryName(airport.country)].filter(Boolean).join(", ");

export async function generateMetadata({ params }) {
  const trip = parse((await params).route);
  if (!trip) return { title: "Flight not found" };
  return { title: `Flights from ${trip.from.city || trip.from.code} to ${trip.to.city || trip.to.code} (${trip.from.code}–${trip.to.code})`, description: `Book flights from ${place(trip.from)} to ${place(trip.to)} on Booking.com, or plan a whole trip with GlobTrek.` };
}

export default async function FlightRoutePage({ params }) {
  const trip = parse((await params).route);
  if (!trip) notFound();
  const { from, to } = trip;
  const km = to.km;
  // A rough block time: cruise near 820 km/h plus taxi, climb and landing.
  const hours = km ? km / 820 + 0.6 : null;
  const duration = hours ? `about ${Math.floor(hours)}h ${String(Math.round((hours % 1) * 60 / 5) * 5).padStart(2, "0")}m nonstop` : null;
  const fare = dotFare(from.code, to.code);

  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <Breadcrumb items={[["Home", "/"], ["Flights", null], [`${from.code} to ${to.code}`, null]]} />
    <section className="mx-auto grid max-w-[1280px] gap-10 px-5 pt-6 sm:px-8 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
      <div>
        <p className="eyebrow">Flight</p>
        <h1 className="mt-3 font-serif text-[clamp(2.4rem,5vw,4.4rem)] font-normal leading-[0.98] tracking-tight-3">{from.city || from.code} to {to.city || to.code}</h1>
        <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-y border-black py-8">
          <div><p className="font-serif text-5xl sm:text-6xl">{from.code}</p><p className="mt-2 text-sm">{from.name}</p><p className="text-sm">{place(from)}</p></div>
          <span className="text-3xl" aria-hidden="true">→</span>
          <div className="text-right"><p className="font-serif text-5xl sm:text-6xl">{to.code}</p><p className="mt-2 text-sm">{to.name}</p><p className="text-sm">{place(to)}</p></div>
        </div>
        <dl className="mt-6 grid gap-6 sm:grid-cols-3">
          {km ? <div><dt className="eyebrow">Distance</dt><dd className="tabular mt-1 text-2xl font-medium">{km.toLocaleString("en-US")} km</dd><dd className="text-xs">{Math.round(km * 0.621371).toLocaleString("en-US")} miles, in a straight line</dd></div> : null}
          {duration ? <div><dt className="eyebrow">Flying time</dt><dd className="tabular mt-1 text-2xl font-medium">{duration.replace(" nonstop", "")}</dd><dd className="text-xs">If nonstop. Connections add time.</dd></div> : null}
          {fare ? <div><dt className="eyebrow">Typical fare</dt><dd className="tabular mt-1 text-2xl font-medium">${fare.average} one way</dd><dd className="text-xs">Average paid over the last year, from ${fare.low} on the cheapest airline. U.S. DOT data, not a live price.</dd></div> : null}
        </dl>
      </div>
      <div className="lg:pt-10">
        <BookItPanel kind="flight" flight={{ from: from.code, to: to.code }} planHref={`/plan?airport=${to.code}&from=${from.code}`} planLabel={`Plan a whole trip to ${to.city || to.code}`} />
      </div>
    </section>
    <p className="mx-auto mt-12 max-w-[1280px] px-5 text-xs leading-5 sm:px-8">GlobTrek may earn a commission if you book through these links, at no extra cost to you. Fares, schedules and availability are on Booking.com.</p>
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}
