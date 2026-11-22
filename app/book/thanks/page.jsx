import Link from "next/link";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { TripThanks } from "../../components/TripThanks";
import { checklistItems } from "../../lib/booking/checklist";
import { isCjUrl } from "../../lib/booking/cj";
import { decodeBookingPage } from "../../lib/booking/bookPage";
import { bookExtras, bookTripKey } from "../bookExtras";
import { storyPhoto } from "../../lib/share/storyPhoto";
import { extraPhoto } from "../../lib/trip/extras";

export const metadata = { title: "Thank you for booking with GlobTrek", robots: { index: false, follow: false } };

const KIND = { flight: "flight", hotel: "stay", experience: "activity" };
const CTA = { flight: "See flights", hotel: "Book the stay", experience: "Book activity", restaurant: "Reserve table" };
const LABEL = { flight: "Flight", hotel: "Stay", experience: "Activity", restaurant: "Dinner" };
const titleCase = (value) => String(value || "").toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (letter) => letter.toUpperCase());

export default async function BookThanksPage({ searchParams }) {
  const { b } = await searchParams;
  const trip = decodeBookingPage(b);
  if (!trip) return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <section className="mx-auto max-w-[var(--width-reading)] px-5 py-[var(--section-space)] text-center">
      <h1 className="text-3xl font-semibold tracking-tight-2">This trip link has expired or is incomplete.</h1>
      <Link href="/discover" className="btn btn-primary mt-8">Find my trip</Link>
    </section>
    <SiteFooter />
  </main>;
  const city = titleCase(trip.city) || "your trip";
  // The same items, ids and order as the booking checklist, so its ticks carry over.
  const [lat, lng] = trip.stayPoint || [];
  const scenic = await storyPhoto({ name: titleCase(trip.city), country: trip.country, ...(Number.isFinite(lat) ? { latitude: lat, longitude: lng } : {}) }).catch(() => null);
  const scenicPhoto = scenic ? { url: scenic.url, alt: city, credit: scenic.local ? null : { artist: scenic.credit, source: scenic.source || null } } : null;
  // These items carry no photo of their own, so each gets the destination or a
  // credited GlobTrek photo of its kind, never one that pretends to be the place.
  const kindPhoto = { experience: extraPhoto("tours"), restaurant: extraPhoto("food-tour") };
  const items = checklistItems(trip.items).map((item) => ({ id: item.id, kind: isCjUrl(item.exactUrl) ? KIND[item.type] || null : null, name: item.name, detail: LABEL[item.type], href: item.exactUrl, sponsored: item.type !== "restaurant", cta: CTA[item.type], photo: kindPhoto[item.type] || scenicPhoto }));
  const key = bookTripKey(trip);
  return <main className="min-h-screen bg-canvas text-ink">
    <SiteHeader />
    <TripThanks destinationName={city} items={items} doneKey={`globtrek:booked:${key}`} refKey={key} extras={bookExtras(trip, city)} story={{ name: city, country: trip.country, departure: trip.start, returnDate: trip.end, ll: Number.isFinite(lat) ? `${lat.toFixed(4)},${lng.toFixed(4)}` : null }} backHref={`/book?b=${encodeURIComponent(b)}`} />
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}
