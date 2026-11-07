import Image from "next/image";
import { BookingLogo } from "../../components/PartnerLogo";
import { bookingPropertyUrl } from "../../data/destinations";
import { LAUNCH_DATA, rideshareUrl } from "../../data/launchSet";
import { cjActivitySearchUrl } from "../../lib/booking/cj";

const PRICE = { 1: "$", 2: "$$", 3: "$$$" };

function Section({ id, title, children }) {
  return <section aria-labelledby={id} className="mx-auto mt-[var(--section-space)] max-w-[1280px] px-5 sm:px-8">
    <h2 id={id} className="text-2xl font-semibold tracking-tight-2">{title}</h2>
    {children}
  </section>;
}

function todaysHours(hours) {
  return hours?.length ? hours[0].replace(/^Monday:\s*/, "Mon ") : null;
}

// Verified stays, dinners, things to do and airport ride for launch destinations.
export function LaunchSections({ item }) {
  const data = LAUNCH_DATA[item.id];
  if (!data) return null;
  const destination = { city: item.name, country: item.country };
  const firstHotel = data.hotels?.[0];
  const uber = rideshareUrl(data.airportRide, firstHotel);
  return <>
    {data.gallery?.length ? <section aria-label={`Photos of ${item.name}`} className="mx-auto mt-6 max-w-[1280px] px-5 sm:px-8">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {data.gallery.map((photo) => <li key={photo.src} className="relative aspect-[4/3] overflow-hidden bg-placeholder">
          <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="(min-width: 640px) 25vw, 50vw" />
        </li>)}
      </ul>
      <p className="mt-2 text-xs text-subtle">Photos: {[...new Set(data.gallery.map((photo) => photo.credit))].join(" · ")}</p>
    </section> : null}

    {data.hotels?.length ? <Section id="stay-heading" title="Where to stay">
      <p className="mt-2 text-sm text-muted">Budget picks, checked on <BookingLogo className="h-3 w-auto" /> on {data.verified}. Prices are live on Booking.com.</p>
      <ul className="mt-6 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2">
        {data.hotels.map((hotel) => <li key={hotel.id} className="flex flex-col justify-between gap-4 bg-bg p-5">
          <div>
            <p className="text-lg font-medium tracking-tight-1">{hotel.name}</p>
            <p className="mt-1 text-sm text-subtle">{hotel.neighborhood} · {hotel.address}</p>
            {hotel.rating ? <p className="tabular mt-1 text-sm">{hotel.rating.toFixed(1)} / 10 · {hotel.reviewCount.toLocaleString("en-US")} Booking.com reviews</p> : null}
            <p className="mt-2 text-sm text-muted">{hotel.note}</p>
          </div>
          <a href={bookingPropertyUrl({ ...hotel, providerLinkVerified: true }, {})} target="_blank" rel="noopener sponsored" className="btn btn-secondary self-start">See rooms ↗</a>
        </li>)}
      </ul>
    </Section> : null}

    {data.dinners?.length ? <Section id="eat-heading" title="Where to eat">
      <ul className="mt-6 divide-y divide-black/10 border-y border-black/10">
        {data.dinners.map((place) => <li key={place.id} className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
          <div>
            <p className="font-medium">{place.name} <span className="text-subtle">{PRICE[place.priceLevel] || ""}</span></p>
            <p className="text-sm text-muted">{place.order}</p>
            <p className="tabular text-xs text-subtle">{place.rating} on Google · {place.reviewCount?.toLocaleString("en-US")} reviews · {place.reservations === "walk-in" ? "Walk in" : "Takes reservations"}{todaysHours(place.hours) ? ` · ${todaysHours(place.hours)}` : ""}</p>
          </div>
          <a href={place.officialWebsiteUrl || place.googleMapsUri} target="_blank" rel="noopener" className="text-sm underline decoration-black/25 underline-offset-4 hover:decoration-ink">{place.reservations === "walk-in" ? "Map and hours ↗" : "Reserve ↗"}</a>
        </li>)}
      </ul>
    </Section> : null}

    {data.activities?.length ? <Section id="do-heading" title="Things to do">
      <ul className="mt-6 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
        {data.activities.map((activity) => <li key={activity.id} className="flex flex-col justify-between gap-3 bg-bg p-5">
          <div>
            <p className="eyebrow">{activity.isFree ? "Free" : `About $${activity.estimatedCostLow}–${activity.estimatedCostHigh}`} · {Math.round(activity.durationMinutes / 15) * 15 >= 60 ? `${Math.round(activity.durationMinutes / 60 * 10) / 10} hr` : `${activity.durationMinutes} min`}</p>
            <p className="mt-2 font-medium">{activity.name}</p>
            <p className="mt-1 text-sm text-muted">{activity.description}</p>
          </div>
          <a href={activity.isFree ? activity.googleMapsUri : cjActivitySearchUrl(activity.name, destination)} target="_blank" rel={activity.isFree ? "noopener" : "noopener sponsored"} className="text-sm underline decoration-black/25 underline-offset-4 hover:decoration-ink">{activity.isFree ? "Map ↗" : <>Tickets on <BookingLogo className="h-3 w-auto" /> ↗</>}</a>
        </li>)}
      </ul>
    </Section> : null}

    {data.airportRide ? <Section id="airport-heading" title="From the airport">
      <dl className="mt-6 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2">
        <div className="bg-bg p-5"><dt className="eyebrow">Public transit</dt><dd className="mt-2 text-sm">{data.airportRide.transit.summary}. {data.airportRide.transit.fare}.</dd><dd className="mt-1 text-xs text-subtle">{data.airportRide.transit.note}. <a href={data.airportRide.transit.checkUrl} target="_blank" rel="noopener" className="underline underline-offset-2">{data.airportRide.transit.checkLabel || "Check current fares"}</a></dd></div>
        <div className="bg-bg p-5"><dt className="eyebrow">Rideshare</dt><dd className="mt-2 text-sm">{data.airportRide.rideshare.summary}. {data.airportRide.rideshare.fare}.</dd>{uber ? <dd className="mt-3"><a href={uber} target="_blank" rel="noopener" className="btn btn-secondary">Uber to {firstHotel.name} ↗</a></dd> : null}</div>
      </dl>
      <p className="mt-2 text-xs text-subtle">{data.airportRide.airport} is about {data.airportRide.miles} miles from {data.airportRide.toCenterLabel || "the city center"}.</p>
    </Section> : null}
  </>;
}
