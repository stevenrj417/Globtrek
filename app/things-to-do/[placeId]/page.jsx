import { cache } from "react";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { Breadcrumb, Chip, PhotoCredit } from "../../components/TravelPage";
import { createPlacesClient } from "../../lib/anyplace/google";
import { isFreeToVisit, ticketsLink } from "../../lib/anyplace/trip";

export const dynamic = "force-dynamic";

const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;
const FIELDS = "id,displayName,formattedAddress,addressComponents,rating,userRatingCount,primaryType,primaryTypeDisplayName,regularOpeningHours.weekdayDescriptions,websiteUri,googleMapsUri,editorialSummary,photos,businessStatus";

// A sight or activity from Google Maps, fetched fresh on every view (nothing
// Google is stored), shown with Google's attribution and photo credits.
// cache(): the page and its metadata share one Google call per request.
const loadPlace = cache(async (placeId) => {
  if (!PLACE_ID.test(placeId || "")) return null;
  const places = createPlacesClient();
  const place = await places.details(placeId, FIELDS).catch(() => null);
  if (!place?.displayName?.text) return null;
  const photos = await Promise.all((place.photos || []).slice(0, 3).map(async (photo, index) => {
    try {
      const url = await places.photo(photo.name, { maxWidthPx: index ? 800 : 1600 });
      const author = photo.authorAttributions?.[0];
      return url ? { url, artist: author?.displayName || null, source: author?.uri || null } : null;
    } catch { return null; }
  }));
  const part = (type) => (place.addressComponents || []).find((item) => item.types?.includes(type))?.longText || null;
  return {
    id: place.id || placeId,
    name: place.displayName.text,
    type: place.primaryTypeDisplayName?.text || null,
    primaryType: place.primaryType || null,
    address: place.formattedAddress || null,
    town: part("locality") || part("postal_town") || part("administrative_area_level_2"),
    country: part("country"),
    rating: Number(place.rating) || null,
    reviews: Number(place.userRatingCount) || null,
    hours: place.regularOpeningHours?.weekdayDescriptions || [],
    website: /^https?:\/\//.test(place.websiteUri || "") ? place.websiteUri : null,
    mapsUrl: place.googleMapsUri || null,
    summary: place.editorialSummary?.text || null,
    closed: place.businessStatus && place.businessStatus !== "OPERATIONAL",
    photos: photos.filter(Boolean),
  };
});

export async function generateMetadata({ params }) {
  const place = await loadPlace((await params).placeId);
  const where = place ? [place.town, place.country].filter(Boolean).join(", ") : "";
  return { title: place ? `${place.name}${where ? `, ${where}` : ""}` : "Things to do", robots: { index: false, follow: true } };
}

export default async function ThingToDoPage({ params }) {
  const { placeId } = await params;
  const place = await loadPlace(placeId);
  if (!place) notFound();
  const where = [place.town, place.country].filter(Boolean).join(", ");
  const tickets = ticketsLink({ name: place.name, primaryType: place.primaryType }, { name: place.town || place.country });
  const free = isFreeToVisit(place);
  const [hero, ...more] = place.photos;
  const button = "inline-flex min-h-14 items-center justify-center gap-2 px-6 text-micro font-medium uppercase tracking-label";

  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <link rel="preconnect" href="https://lh3.googleusercontent.com" />
    <Breadcrumb items={[["Home", "/"], [place.town || "Things to do", null], [place.name, null]]} />
    <section className="mx-auto grid max-w-[1280px] gap-8 px-5 pt-4 sm:px-8 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden bg-placeholder">
          {/* eslint-disable-next-line @next/next/no-img-element -- Google photos load straight from Google */}
          {hero ? <img src={hero.url} alt={place.name} className="image-calm absolute inset-0 h-full w-full object-cover" /> : <span className="grid h-full place-items-center p-8 text-center font-serif text-3xl">{place.name}</span>}
          {place.type ? <div className="absolute left-3 top-3"><Chip>{place.type}</Chip></div> : null}
          <PhotoCredit credit={hero?.artist ? hero : null} />
        </div>
        {more.length ? <ul className="mt-2 grid grid-cols-2 gap-2">{more.map((photo) => <li key={photo.url} className="relative aspect-[4/3] overflow-hidden bg-placeholder">
          {/* eslint-disable-next-line @next/next/no-img-element -- Google photos load straight from Google */}
          <img src={photo.url} alt={place.name} loading="lazy" className="image-calm absolute inset-0 h-full w-full object-cover" />
          <PhotoCredit credit={photo.artist ? photo : null} />
        </li>)}</ul> : null}
        <p className="mt-2 text-xs">Place details, ratings and photos from Google Maps.</p>
      </div>
      <div>
        {where ? <p className="eyebrow">{where}</p> : null}
        <h1 className="mt-3 text-balance font-serif text-[clamp(2.2rem,4.5vw,3.8rem)] font-normal leading-[0.98] tracking-tight-3">{place.name}</h1>
        {place.rating ? <p className="tabular mt-3 text-sm">★ {place.rating.toFixed(1)}{place.reviews ? ` · ${place.reviews.toLocaleString("en-US")} Google reviews` : ""}</p> : null}
        {place.closed ? <p className="mt-3 text-sm font-medium text-warning">Google lists this place as closed.</p> : null}
        {place.summary ? <p className="mt-4 text-base leading-7">{place.summary}</p> : null}
        {place.address ? <p className="mt-4 text-sm">{place.address}</p> : null}
        <div className="mt-7 grid gap-2 border border-black bg-white p-5 sm:p-7">
          {tickets && !free ? <a href={tickets} target="_blank" rel="noopener sponsored" className={`${button} bg-black text-white hover:bg-black/85`}>Book tickets or a tour <span aria-hidden="true">↗</span><span className="sr-only"> (opens Booking.com in a new tab)</span></a> : null}
          {place.mapsUrl ? <a href={place.mapsUrl} target="_blank" rel="noopener" className={`${button} ${tickets && !free ? "border border-black/25 hover:border-black" : "bg-black text-white hover:bg-black/85"}`}>{free ? "Free to visit: get directions" : "Directions and hours"} <span aria-hidden="true">↗</span><span className="sr-only"> (opens Google Maps in a new tab)</span></a> : null}
          {place.website ? <a href={place.website} target="_blank" rel="noopener" className={`${button} border border-black/25 hover:border-black`}>Official website <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a> : null}
          <a href={`/plan?a=${encodeURIComponent(place.id)}`} className={`${button} border border-black hover:bg-black hover:text-white`}>Plan a whole trip around it <span aria-hidden="true">→</span></a>
          <p className="mt-2 text-xs leading-5">{tickets && !free ? "Tickets and tours open on Booking.com, where you see live prices and pay. " : ""}A whole trip adds a place to stay, dinners and more nearby, booked in order from one page.</p>
        </div>
        {place.hours.length ? <div className="mt-7">
          <h2 className="text-micro font-medium uppercase tracking-label">Opening hours</h2>
          <ul className="mt-3 space-y-1 text-sm">{place.hours.map((line) => <li key={line}>{line}</li>)}</ul>
          <p className="mt-2 text-xs">Hours from Google Maps; check before you go.</p>
        </div> : null}
      </div>
    </section>
    <p className="mx-auto mt-12 max-w-[1280px] px-5 text-xs leading-5 sm:px-8">GlobTrek may earn a commission if you book tickets or tours through these links, at no extra cost to you.</p>
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}
