import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { Breadcrumb, Chip } from "../../components/TravelPage";
import { BookItPanel } from "../../components/BookItPanel";
import { BookingLogo } from "../../components/PartnerLogo";
import { stayById } from "../../lib/search/stays";
import { AmenityChecklist } from "../../components/HotelDetails";
import { ExploreMap } from "../../components/ExploreMap";
import { amenityChecklist } from "../../lib/hotels/amenities";

export const revalidate = 86400;

// Booking.com's CDN serves the same photo at a larger size for a hero.
const large = (url) => String(url || "").replace("/max500/", "/max1024x768/");
const TIER_BUDGET = { budget: "budget", mid: "mid", comfort: "comfort", luxury: "luxury" };
const KEY_AMENITIES = /free wifi|wifi|pool|parking|breakfast|airport shuttle|spa|fitness|gym|restaurant|bar|kitchen|air conditioning|pets allowed|family rooms|beach|terrace|garden|non-smoking|24-hour front desk|elevator|lift|wheelchair/i;

export async function generateMetadata({ params }) {
  const stay = await stayById((await params).id);
  if (!stay) return { title: "Hotel not found" };
  const where = [stay.city, stay.country].filter(Boolean).join(", ");
  return { title: `${stay.name}, ${where}`, description: `${stay.name} in ${where}: photos, facilities and booking on Booking.com, or plan a whole trip around it with GlobTrek.` };
}

export default async function HotelPage({ params }) {
  const stay = await stayById((await params).id);
  if (!stay) notFound();
  const where = [stay.city, stay.region, stay.country].filter(Boolean).filter((part, index, list) => list.indexOf(part) === index).join(", ");
  const chips = [stay.stars ? `${stay.stars}-star ${String(stay.category || "stay").toLowerCase()}` : stay.category, stay.dorms ? "Dorm beds" : null].filter(Boolean);
  const amenities = [...stay.amenities.filter((item) => KEY_AMENITIES.test(item)), ...stay.amenities.filter((item) => !KEY_AMENITIES.test(item))].filter((item, index, list) => list.indexOf(item) === index).slice(0, 18);
  const perks = [stay.freeCancellation ? "Free cancellation on some rooms" : null, stay.freeBreakfast ? "Breakfast included on some rooms" : null].filter(Boolean);
  const [hero, ...rest] = stay.photos;

  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <Breadcrumb items={[["Home", "/"], [stay.city || "Hotels", null], [stay.name, null]]} />
    <section className="mx-auto grid max-w-[1280px] gap-8 px-5 pt-4 sm:px-8 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden bg-placeholder">
          {hero ? <Image src={large(hero)} alt={`${stay.name}, photo from Booking.com`} fill priority sizes="(min-width: 1024px) 720px, 100vw" className="image-calm object-cover" /> : null}
          {chips.length ? <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{chips.map((chip) => <Chip key={chip}>{chip}</Chip>)}</div> : null}
        </div>
        {rest.length ? <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">{rest.slice(0, 5).map((photo, index) => <li key={photo} className="relative aspect-square overflow-hidden bg-placeholder"><Image src={photo} alt={`${stay.name}, photo ${index + 2} from Booking.com`} fill sizes="160px" className="image-calm object-cover" /></li>)}</ul> : null}
        <p className="mt-2 text-xs">Photos from <BookingLogo className="inline h-3 w-auto align-baseline" /></p>
      </div>
      <div>
        <p className="eyebrow">{where}</p>
        <h1 className="mt-3 text-balance font-serif text-[clamp(2.2rem,4.5vw,3.8rem)] font-normal leading-[0.98] tracking-tight-3">{stay.name}</h1>
        {stay.street ? <p className="mt-3 text-sm">{[stay.street, stay.city].filter(Boolean).join(", ")}</p> : null}
        {perks.length ? <ul className="mt-4 flex flex-wrap gap-1.5 text-xs">{perks.map((perk) => <li key={perk} className="border border-black/20 px-2 py-1">{perk}</li>)}</ul> : null}
        <div className="mt-7">
          <BookItPanel kind="stay" stay={{ bookingUrl: stay.bookingUrl }} planHref={`/plan?stay=${stay.id}&budget=${TIER_BUDGET[stay.tier] || "mid"}`} planLabel={`Plan a whole trip around it`} />
        </div>
      </div>
    </section>

    <section className="mx-auto mt-[var(--section-space)] grid max-w-[1280px] gap-10 px-5 sm:px-8 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
      {stay.description ? <div>
        <h2 className="font-serif text-3xl font-normal tracking-tight-3 sm:text-4xl">About this stay</h2>
        <p className="mt-4 max-w-[var(--width-reading)] text-base leading-7">{stay.description}</p>
        {stay.roomTypes.length ? <>
          <h3 className="mt-8 text-micro font-medium uppercase tracking-label">Room types</h3>
          <ul className="mt-3 space-y-1.5 text-sm">{stay.roomTypes.map((room) => <li key={room}>{room}</li>)}</ul>
        </> : null}
      </div> : <div />}
      {amenities.length ? <div>
        <h2 className="font-serif text-3xl font-normal tracking-tight-3 sm:text-4xl">Facilities</h2>
        <ul className="mt-4 flex flex-wrap gap-1.5 text-sm">{amenities.map((item) => <li key={item} className="border border-black/15 px-2.5 py-1">{item}</li>)}</ul>
        <p className="mt-4 text-xs leading-5">As listed on Booking.com. Check the room you choose there: some facilities cost extra or apply to certain rooms only.</p>
      </div> : null}
    </section>
    <section className="mx-auto mt-[var(--section-space)] max-w-[1280px] px-5 sm:px-8">
      <div className="max-w-2xl">
        <h2 className="font-serif text-3xl font-normal tracking-tight-3 sm:text-4xl">At a glance</h2>
        <div className="mt-6"><AmenityChecklist checklist={amenityChecklist(stay)} /></div>
        <p className="mt-5 text-xs leading-5">&ldquo;Not listed&rdquo; means the Booking.com listing doesn&apos;t mention it; ask the hotel if it matters.</p>
      </div>
    </section>
    {stay.latitude != null ? <section className="mx-auto mt-[var(--section-space)] max-w-[1280px] px-5 sm:px-8">
      <h2 className="font-serif text-3xl font-normal tracking-tight-3 sm:text-4xl">Explore the area</h2>
      <ExploreMap className="mt-6" latitude={stay.latitude} longitude={stay.longitude} label={stay.name} query={[stay.name, stay.city].filter(Boolean).join(", ")} zoomKm={1.5} />
    </section> : null}
    <p className="mx-auto mt-12 max-w-[1280px] px-5 text-xs leading-5 sm:px-8">GlobTrek may earn a commission if you book through these links, at no extra cost to you. Prices and availability are on Booking.com.</p>
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}
