import { travelInfoFor, TRAVEL_INFO_CHECKED } from "../../data/travelInfo";
import { LAUNCH_DATA } from "../../data/launchSet";

function money(value) {
  return `$${Math.round(value || 0).toLocaleString("en-US")}`;
}

function title(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s&'-])\S/g, (letter) => letter.toUpperCase());
}

// Season, getting from the airport, and official entry and safety pages.
export function BeforeYouGo({ trip, seasonWarning }) {
  const info = travelInfoFor(trip.country);
  const ride = LAUNCH_DATA[trip.id]?.airportRide || null;
  const miles = ride?.miles || trip.airportToCenterMiles;
  const transfer = Number(trip.planningAverages?.airportTransferPerPerson) || 0;
  const directions = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${trip.airport} airport`)}&destination=${encodeURIComponent(`${title(trip.city)}, ${title(trip.country)}`)}&travelmode=transit`;
  return <section id="before-you-go" aria-labelledby="before-heading" className="scroll-mt-24 border-t border-black/15 px-6 py-10 sm:px-12">
    <div className="mx-auto max-w-[1180px]">
      <h2 id="before-heading" className="font-serif text-[clamp(1.8rem,3vw,2.5rem)] leading-[.95] tracking-tight-2">Before you go</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div>
          <h3 className="text-micro uppercase tracking-label text-black/60">When to go</h3>
          <p className="mt-2 text-sm leading-6">Best time to visit: {trip.season}.</p>
          {seasonWarning ? <p className="mt-2 border-l-2 border-warning pl-3 text-sm leading-6">Your travel month is outside the usual season for {title(trip.city)}. Check weather, closures and opening hours.</p> : null}
        </div>
        <div>
          <h3 className="text-micro uppercase tracking-label text-black/60">Getting there and around</h3>
          <p className="mt-2 text-sm leading-6">Fly into {ride?.airport || trip.airport}{miles ? `, about ${miles} miles from ${ride?.toCenterLabel || "the center"}` : ""}.{transfer ? ` The estimate includes about ${money(transfer)} per person each way for the airport transfer.` : ""}</p>
          {ride?.transit ? <p className="mt-2 text-sm leading-6">{ride.transit.summary}{ride.transit.fare ? ` (${ride.transit.fare})` : ""}.{ride.transit.checkUrl ? <> <a href={ride.transit.checkUrl} target="_blank" rel="noopener" className="underline underline-offset-4">{ride.transit.checkLabel || "Check current fares"}<span className="sr-only"> (opens in a new tab)</span></a></> : null}</p> : null}
          <a href={directions} target="_blank" rel="noopener" className="mt-2 inline-flex min-h-11 items-center text-sm underline decoration-black/30 underline-offset-4">Transit directions from the airport on Google Maps<span className="sr-only"> (opens in a new tab)</span> ↗</a>
        </div>
        <div>
          <h3 className="text-micro uppercase tracking-label text-black/60">Entry and safety</h3>
          {info?.domestic ? <p className="mt-2 text-sm leading-6">Domestic trip for U.S. travelers: no passport needed, but you need TSA-accepted ID such as a REAL ID.</p> : <p className="mt-2 text-sm leading-6">Passport, visa and entry rules depend on your nationality. Check the official pages before you book.</p>}
          {info ? <ul className="mt-2 space-y-1 text-sm">
            {info.domestic ? <li><a href="https://www.tsa.gov/travel/security-screening/identification" target="_blank" rel="noopener" className="inline-flex min-h-11 items-center underline underline-offset-4">TSA: acceptable ID<span className="sr-only"> (opens in a new tab)</span> ↗</a></li> : null}
            {info.usCitizensUrl ? <li><a href={info.usCitizensUrl} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center underline underline-offset-4">{info.usCitizensLabel}<span className="sr-only"> (opens in a new tab)</span> ↗</a></li> : null}
            {!info.domestic ? <li><a href={info.entryUrl} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center underline underline-offset-4">{info.entryLabel}<span className="sr-only"> (opens in a new tab)</span> ↗</a></li> : null}
            {!info.domestic ? <li><a href={info.advisoryUrl} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center underline underline-offset-4">{info.advisoryLabel}<span className="sr-only"> (opens in a new tab)</span> ↗</a></li> : null}
          </ul> : null}
          <p className="mt-1 text-micro text-black/50">Links checked {TRAVEL_INFO_CHECKED}.</p>
        </div>
      </div>
    </div>
  </section>;
}
