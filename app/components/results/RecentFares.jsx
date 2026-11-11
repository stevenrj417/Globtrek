"use client";

import { useEffect, useState } from "react";
import { track } from "../../lib/analytics";

const money = (value) => `$${Math.round(value || 0).toLocaleString("en-US")}`;
const short = (value) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
const time = (value) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

function nextMonths(count, now = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1 + index, 1));
    return date.toISOString().slice(0, 7);
  });
}

// Round-trip fares Aviasales travelers found recently for this exact route,
// labelled as cached fares (never as bookable live prices).
export function RecentFares({ origin, destination, depart, ret, months, nights, adults }) {
  const [result, setResult] = useState({ key: null, status: "loading", fares: [] });
  const monthList = (months?.length ? months : nextMonths(3)).join(",");
  const ready = /^[A-Z]{3}$/.test(origin || "") && /^[A-Z]{3}$/.test(destination || "") && origin !== destination;
  const key = [origin, destination, depart, ret, monthList, nights, adults].join("|");
  const state = result.key === key ? result : { status: "loading", fares: [] };

  useEffect(() => {
    if (!ready) return undefined;
    const controller = new AbortController();
    const params = new URLSearchParams({ origin, destination, nights: String(nights), adults: String(adults) });
    if (depart && ret) { params.set("depart", depart); params.set("return", ret); } else params.set("months", monthList);
    fetch(`/api/flights/fares?${params}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((body) => setResult({ key, status: body.available ? "ready" : "unavailable", fares: body.fares || [], checkedAt: body.checkedAt }))
      .catch((error) => { if (error.name !== "AbortError") setResult({ key, status: "unavailable", fares: [] }); });
    return () => controller.abort();
  }, [ready, key, origin, destination, depart, ret, monthList, nights, adults]);

  if (!ready || state.status === "unavailable") return null;
  const exact = depart && ret;
  return <section className="border-t border-black/15 px-6 py-8 sm:px-12" aria-labelledby="recent-fares-heading" aria-busy={state.status === "loading"}>
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="recent-fares-heading" className="text-micro uppercase tracking-editorial">Fares travelers found recently · {origin} → {destination}</h3>
        {state.checkedAt ? <p className="text-micro text-black/55">Checked {time(state.checkedAt)}</p> : null}
      </div>
      {state.status === "loading" ? <p className="mt-4 text-xs text-black/55">Looking up recent fares…</p> : state.fares.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {state.fares.map((fare) => <li key={`${fare.departDate}-${fare.returnDate}-${fare.pricePerPerson}`} className="flex flex-col justify-between border border-black/15 bg-white p-4">
          <div>
            <p className="tabular font-serif text-2xl">{money(fare.pricePerPerson)} <span className="font-sans text-xs">per person, round trip</span></p>
            {fare.adults > 1 ? <p className="tabular mt-1 text-xs">{money(fare.groupTotal)} for {fare.adults} adults</p> : null}
            <p className="mt-2 text-xs">{short(fare.departDate)} → {short(fare.returnDate)}{fare.exactDates ? " · your dates" : ""} · {fare.stops === 0 ? "nonstop" : fare.stops ? `${fare.stops} stop${fare.stops === 1 ? "" : "s"}` : "stops vary"}</p>
            {fare.otherAirport ? <p className="mt-1 text-xs"><strong>Arrives at {fare.otherAirport}</strong>, not {destination}.</p> : null}
            {fare.otherReturnAirport ? <p className="mt-1 text-xs"><strong>Returns to {fare.otherReturnAirport}</strong>, not {origin}.</p> : null}
          </div>
          <a href={fare.bookingUrl} target="_blank" rel="noopener sponsored" onClick={() => track("recent_fare_opened", { route: `${origin}-${destination}`, exact: fare.exactDates })} className="mt-4 inline-flex min-h-11 items-center justify-center border border-black px-4 text-micro uppercase tracking-label hover:bg-black hover:text-white">Check this fare on Aviasales <span className="ml-2" aria-hidden="true">↗</span></a>
        </li>)}
      </ul> : <p className="mt-4 text-xs">No recent fares seen for this route{exact ? " on your dates" : ""}. Use the flight search above for current prices.</p>}
      <p className="mt-4 max-w-2xl text-xs leading-5 text-black/55">Cached fares from Aviasales searches in the last few days, not live prices. They may have changed or sold out; the airline or agency shows the current price before you pay.{exact ? "" : " Dates shown are the cheapest found in your travel period."}</p>
    </div>
  </section>;
}
