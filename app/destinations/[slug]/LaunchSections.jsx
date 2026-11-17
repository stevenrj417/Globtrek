import Image from "../../components/Photo";
import { BookingLogo } from "../../components/PartnerLogo";
import { bookingPropertyUrl } from "../../data/destinations";
import { LAUNCH_DATA, rideshareUrl } from "../../data/launchSet";
import { FEED_STAYS_CHECKED, launchHotels } from "../../data/launchStays";
import { cjActivitySearchUrl } from "../../lib/booking/cj";
import { curatedActivities, curatedRestaurants } from "../../lib/places/curated";
import { CardRow, CardRowItem, Chip, NumberedPlaces, PlaceTiles, Section, textLink } from "../../components/TravelPage";

const PRICE = { 1: "$", 2: "$$", 3: "$$$" };
const PRICE_LEVEL = { PRICE_LEVEL_INEXPENSIVE: "$", PRICE_LEVEL_MODERATE: "$$", PRICE_LEVEL_EXPENSIVE: "$$$", PRICE_LEVEL_VERY_EXPENSIVE: "$$$$" };
const titleCase = (value) => String(value || "").replace(/\b\w/g, (letter) => letter.toUpperCase());

// Verified Google Places results (scripts/activities/curate-places.mjs), the same
// ones trips use, for guides without a hand-picked list.
function placeRows(places, limit) {
  return places.filter((place) => place.businessStatus !== "CLOSED_PERMANENTLY" && place.googleMapsUrl).slice(0, limit);
}
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

function todaysHours(hours) {
  return hours?.length ? hours[0].replace(/^Monday:\s*/, "Mon ") : null;
}

// Verified stays, dinners, things to do and airport ride for launch destinations.
export function LaunchSections({ item }) {
  const data = LAUNCH_DATA[item.id] || {};
  const hotels = launchHotels(item.id);
  const places = data.activities?.length ? [] : placeRows(curatedActivities(item.id), 9);
  const eats = data.dinners?.length ? [] : placeRows(curatedRestaurants(item.id), 6);
  if (!LAUNCH_DATA[item.id] && !hotels.length && !places.length && !eats.length) return null;
  const destination = { city: item.name, country: item.country };
  const firstHotel = data.hotels?.[0];
  const uber = rideshareUrl(data.airportRide, firstHotel);
  return <>
    {data.gallery?.length ? <section aria-label={`Photos of ${item.name}`} className="mx-auto mt-[var(--section-space)] max-w-[1280px] px-5 sm:px-8">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {data.gallery.map((photo) => <li key={photo.src} className="relative aspect-[4/3] overflow-hidden bg-placeholder">
          <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="(min-width: 640px) 25vw, 50vw" />
        </li>)}
      </ul>
      <p className="mt-2 text-xs text-subtle">Photos: {[...new Set(data.gallery.map((photo) => photo.credit))].join(" · ")}</p>
    </section> : null}

    {hotels.length ? <Section id="stay-heading" eyebrow="From Booking.com" title="Where to stay" intro={`Hostels and budget stays, from Booking.com listings checked ${FEED_STAYS_CHECKED || data.verified}. Check current prices and availability on Booking.com.`}>
      <CardRow>
        {hotels.map((hotel, index) => {
          const kind = hotel.priceTier === "hostel" ? hotel.category || "Hostel" : hotel.category;
          const chips = [hotel.starRating ? `${hotel.starRating}-star ${String(kind || "stay").toLowerCase()}` : kind, hotel.dorms ? "Dorm beds" : null].filter(Boolean);
          return <CardRowItem key={hotel.id}>
            <div className="relative aspect-[4/5] overflow-hidden bg-placeholder">
              {hotel.photos?.[0] ? <Image src={hotel.photos[0]} alt={`${hotel.name}, photo from Booking.com`} fill className="image-calm object-cover" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 80vw" loading={index < 2 ? "eager" : "lazy"} /> : null}
              {chips.length ? <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{chips.map((chip) => <Chip key={chip}>{chip}</Chip>)}</div> : null}
            </div>
            <div className="flex flex-1 flex-col pt-4">
              <h3 className="text-xl font-medium leading-snug tracking-tight-2">{hotel.name}</h3>
              {hotel.neighborhood || hotel.address ? <p className="mt-1 line-clamp-2 text-xs text-subtle">{[hotel.neighborhood, hotel.address].filter(Boolean).join(" · ")}</p> : null}
              {hotel.rating ? <p className="tabular mt-2 text-sm">{hotel.rating.toFixed(1)} / 10 <span className="text-subtle">· {hotel.reviewCount.toLocaleString("en-US")} reviews</span></p> : null}
              {hotel.bedNight ? <p className="tabular mt-2 text-sm"><span className="font-medium">Beds from about ${hotel.bedNight}</span> a night, taxes in<span className="block text-xs text-subtle">{hotel.verifiedAt ? `Seen ${hotel.verifiedAt}; ` : ""}not a live price</span></p> : hotel.fromFeed ? null : hotel.note ? <p className="mt-2 text-sm text-muted">{hotel.note}</p> : null}
              {hotel.tags?.filter((tag) => !/dorm/i.test(tag)).length ? <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">{hotel.tags.filter((tag) => !/dorm/i.test(tag)).slice(0, 4).map((tag) => <li key={tag} className="border border-black/15 px-2 py-0.5">{tag}</li>)}</ul> : null}
              {hotel.maxGuests && !hotel.dorms ? <p className="mt-2 text-xs text-subtle">Sleeps up to {hotel.maxGuests}</p> : null}
              <MonthlyBeds prices={hotel.monthlyNight} />
              <div className="mt-auto pt-5">
                <a href={bookingPropertyUrl({ ...hotel, providerLinkVerified: true }, {})} target="_blank" rel="noopener sponsored" className="btn btn-primary w-full">See rooms and prices ↗</a>
              </div>
            </div>
          </CardRowItem>;
        })}
      </CardRow>
      <p className="mt-6 text-xs text-subtle">Listings on <BookingLogo className="h-3 w-auto" />. You book and pay on Booking.com.</p>
    </Section> : null}

    {data.dinners?.length ? <Section id="eat-heading" eyebrow="From Google Maps" title="Where to eat">
      <NumberedPlaces places={data.dinners.map((place) => ({ key: place.id, name: place.name, category: place.order, price: PRICE[place.priceLevel] || null, rating: place.rating, reviewCount: place.reviewCount, tags: [place.reservations === "walk-in" ? "Walk in" : "Takes reservations"], note: todaysHours(place.hours), href: place.officialWebsiteUrl || place.googleMapsUri, linkLabel: place.reservations === "walk-in" ? "Map and hours ↗" : "Reserve ↗" }))} />
    </Section> : null}

    {eats.length ? <Section id="eat-heading" eyebrow="From Google Maps" title="Where to eat" intro="Well-reviewed and open, near the center.">
      <NumberedPlaces places={eats.map((place) => ({ key: place.id, name: place.name, category: place.category ? titleCase(place.category) : null, price: PRICE_LEVEL[place.priceLevel] || null, rating: place.rating, reviewCount: place.reviewCount, href: place.googleMapsUrl }))} />
    </Section> : null}

    {data.activities?.length ? <Section id="do-heading" eyebrow="Picked for you" title="Things to do">
      <PlaceTiles places={data.activities.map((activity) => ({
        key: activity.id,
        name: activity.name,
        description: activity.description,
        eyebrow: `${activity.isFree ? "Free" : `About $${activity.estimatedCostLow}–${activity.estimatedCostHigh}`} · ${Math.round(activity.durationMinutes / 15) * 15 >= 60 ? `${Math.round(activity.durationMinutes / 60 * 10) / 10} hr` : `${activity.durationMinutes} min`}`,
        href: activity.isFree ? activity.googleMapsUri : activity.payAtGate ? activity.officialWebsiteUrl || activity.googleMapsUri : cjActivitySearchUrl(activity.name, destination),
        sponsored: !activity.isFree && !activity.payAtGate,
        linkLabel: activity.isFree ? "Map" : activity.payAtGate ? "Pay at the gate · official site" : "Tickets on Booking.com",
      }))} />
    </Section> : null}

    {places.length ? <Section id="do-heading" eyebrow="From Google Maps" title="Things to do" intro="Ranked by how many people have reviewed them.">
      <PlaceTiles places={places.map((place) => ({ key: place.id, name: place.name, eyebrow: place.category ? titleCase(place.category) : null, rating: place.rating, reviewCount: place.reviewCount, href: place.googleMapsUrl }))} />
    </Section> : null}

    {data.airportRide ? <Section id="airport-heading" eyebrow="Getting in" title="From the airport" intro={`${data.airportRide.airport} is about ${data.airportRide.miles} miles from ${data.airportRide.toCenterLabel || "the city center"}.`}>
      <dl className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="bg-surface p-6 sm:p-8"><dt className="font-serif text-2xl tracking-tight-2">Public transit</dt><dd className="mt-3 text-base">{data.airportRide.transit.summary}. {data.airportRide.transit.fare}.</dd><dd className="mt-2 text-xs text-subtle">{data.airportRide.transit.note}. <a href={data.airportRide.transit.checkUrl} target="_blank" rel="noopener" className={textLink}>{data.airportRide.transit.checkLabel || "Check current fares"}</a></dd></div>
        <div className="bg-surface p-6 sm:p-8"><dt className="font-serif text-2xl tracking-tight-2">Rideshare</dt><dd className="mt-3 text-base">{data.airportRide.rideshare.summary}. {data.airportRide.rideshare.fare}.</dd>{uber ? <dd className="mt-5"><a href={uber} target="_blank" rel="noopener" className="btn btn-secondary">Uber to {firstHotel.name} ↗</a></dd> : null}</div>
      </dl>
    </Section> : null}
  </>;
}
