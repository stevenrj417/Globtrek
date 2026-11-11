import Image from "next/image";
import { BookingLogo } from "../../components/PartnerLogo";
import { bookingPropertyUrl } from "../../data/destinations";
import { LAUNCH_DATA, rideshareUrl } from "../../data/launchSet";
import { FEED_STAYS_CHECKED, launchHotels } from "../../data/launchStays";
import { cjActivitySearchUrl } from "../../lib/booking/cj";

const PRICE = { 1: "$", 2: "$$", 3: "$$$" };
const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Expected dorm-bed price for each month, cheapest month highlighted.
function MonthlyBeds({ prices }) {
  if (!prices?.length) return null;
  const low = Math.min(...prices);
  return <div className="mt-3">
    <p className="text-xs text-subtle">Expected bed price by month</p>
    <ol className="tabular mt-1 grid grid-cols-12 gap-px text-center text-[11px]">
      {prices.map((price, index) => <li key={MONTH_NAMES[index]} title={`${MONTH_NAMES[index]}: about $${price} a night`} className={price === low ? "bg-ink/10 font-medium" : ""}>
        <span className="block text-subtle">{MONTH_INITIALS[index]}</span>${price}
      </li>)}
    </ol>
  </div>;
}

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
  const data = LAUNCH_DATA[item.id] || {};
  const hotels = launchHotels(item.id);
  if (!LAUNCH_DATA[item.id] && !hotels.length) return null;
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

    {hotels.length ? <Section id="stay-heading" title="Where to stay">
      <p className="mt-2 text-sm text-muted">Hostels and budget stays only, from <BookingLogo className="h-3 w-auto" /> listings (checked {FEED_STAYS_CHECKED || data.verified}). Check current prices and availability on Booking.com.</p>
      <ul className="mt-6 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2">
        {hotels.map((hotel) => <li key={hotel.id} className="flex flex-col justify-between gap-4 bg-bg p-5">
          <div>
            {hotel.photos?.[0] ? <div className="relative mb-4 aspect-[16/9] overflow-hidden bg-placeholder">
              <Image src={hotel.photos[0]} alt={`${hotel.name}, photo from Booking.com`} fill className="object-cover" sizes="(min-width: 640px) 40vw, 100vw" />
            </div> : null}
            <p className="text-lg font-medium tracking-tight-1">{hotel.name}</p>
            <p className="mt-1 text-sm text-subtle">{[hotel.priceTier === "hostel" ? hotel.category || "Hostel" : hotel.category, hotel.starRating ? `${hotel.starRating}-star` : null, hotel.neighborhood, hotel.address].filter(Boolean).join(" · ") || "Hostel · cheapest well-reviewed bed"}</p>
            {hotel.rating ? <p className="tabular mt-1 text-sm">{hotel.rating.toFixed(1)} / 10 · {hotel.reviewCount.toLocaleString("en-US")} Booking.com reviews</p> : null}
            {hotel.bedNight ? <p className="tabular mt-2 text-sm font-medium">Dorm beds seen from about ${hotel.bedNight} a night, taxes in{hotel.verifiedAt ? ` (checked ${hotel.verifiedAt})` : ""}; not a live price</p> : hotel.fromFeed ? null : <p className="mt-2 text-sm text-muted">{hotel.note}</p>}
            {hotel.tags?.length ? <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">{hotel.tags.map((tag) => <li key={tag} className="border border-black/15 px-2 py-0.5">{tag}</li>)}</ul> : null}
            {hotel.roomTypes?.length ? <p className="mt-3 text-sm text-muted">Rooms: {hotel.roomTypes.slice(0, 3).join(" · ")}{hotel.roomTypes.length > 3 ? ` · +${hotel.roomTypes.length - 3} more` : ""}</p> : null}
            {hotel.maxGuests && !hotel.dorms ? <p className="text-xs text-subtle">Sleeps up to {hotel.maxGuests}{hotel.bedsDescription ? ` · ${hotel.bedsDescription}` : ""}</p> : null}
            <MonthlyBeds prices={hotel.monthlyNight} />
          </div>
          <a href={bookingPropertyUrl({ ...hotel, providerLinkVerified: true }, {})} target="_blank" rel="noopener sponsored" className="btn btn-secondary self-start">See rooms and prices ↗</a>
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
          {activity.isFree ? <a href={activity.googleMapsUri} target="_blank" rel="noopener" className="text-sm underline decoration-black/25 underline-offset-4 hover:decoration-ink">Map ↗</a>
            : activity.payAtGate ? <a href={activity.officialWebsiteUrl || activity.googleMapsUri} target="_blank" rel="noopener" className="text-sm underline decoration-black/25 underline-offset-4 hover:decoration-ink">Pay at the gate · official site ↗</a>
            : <a href={cjActivitySearchUrl(activity.name, destination)} target="_blank" rel="noopener sponsored" className="text-sm underline decoration-black/25 underline-offset-4 hover:decoration-ink">Tickets on <BookingLogo className="h-3 w-auto" /> ↗</a>}
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
