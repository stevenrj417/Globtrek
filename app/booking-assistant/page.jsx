import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { ASSISTANT_INSTALL_URL } from "../lib/booking/assistant";

export const metadata = {
  title: "Booking Assistant for Chrome",
  description: "Book your whole GlobTrek trip from one tab: the assistant opens each booking on the partner's site and fills your details where the partner allows it. You review and pay on their site.",
};

const STEPS = [
  ["Plan on GlobTrek", "Choose your stay, flight, activities and dinners. Nothing changes about how you plan."],
  ["Choose Book my trip", "The assistant opens next to GlobTrek and shows exactly which details it will use and which sites will receive them."],
  ["Enter your details once", "Names, contact details and preferences for everyone traveling — saved on your computer, or used once and forgotten."],
  ["Open, fill, review", "Each booking opens with GlobTrek's exact link. Where the partner allows it, your details are filled in; everywhere else, copy buttons do it in a click."],
  ["You pay the partner", "The assistant stops before anything is booked. Review and pay on the partner's site, then tick it off."],
];

const PARTNERS = [
  ["GetYourGuide activities", "Fills lead-traveler name, email, phone and notes on the checkout page.", "Fills details"],
  ["Booking.com stays, flights and attractions", "Opens GlobTrek's exact link with your dates and party size. Booking.com's terms don't allow automated assistants without permission, so the assistant gives you copy buttons instead.", "Copy buttons"],
  ["OpenTable dinners", "Opens the restaurant with your party size. OpenTable's terms don't allow browser assistants, so you get copy buttons.", "Copy buttons"],
  ["GlobTrek flight checkout", "Planned. Not live yet.", "Coming later"],
];

export default function BookingAssistantPage() {
  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <section className="border-b border-black/10 bg-canvas">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-[var(--section-space)] sm:px-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
        <div>
          <p className="eyebrow">GlobTrek Booking Assistant · for Chrome</p>
          <h1 className="mt-5 font-serif text-[clamp(2.8rem,7vw,5.6rem)] leading-[.92] tracking-tight-3">Book your whole trip from one tab.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">A small Chrome extension that opens every booking from your GlobTrek trip and fills in your details where the partner allows it. You stay in control: it never books, accepts terms or pays for you.</p>
        </div>
        <div id="install" className="scroll-mt-24 border border-black/15 bg-surface p-6 sm:p-7">
          <p className="text-micro uppercase tracking-label text-black/55">Install</p>
          <p className="mt-3 text-sm leading-6">Free, no account. Needs Chrome on a computer (Windows, Mac, Linux or ChromeOS).</p>
          {ASSISTANT_INSTALL_URL.startsWith("https://chromewebstore.google.com/")
            ? <a href={ASSISTANT_INSTALL_URL} className="btn btn-primary mt-5 w-full">Add to Chrome</a>
            : <p className="mt-5 border-l-2 border-brass pl-3 text-sm leading-6"><strong>Coming soon to the Chrome Web Store.</strong> Until then, every booking on your trip page opens with one click and your details are ready to copy.</p>}
          <p className="mt-4 text-xs leading-5 text-subtle">On a phone or tablet? Your trip page works as it always has — open each booking and check it off.</p>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-[1180px] px-6 py-[var(--section-space)] sm:px-8">
      <h2 className="font-serif text-[clamp(1.9rem,3.5vw,2.8rem)] leading-none tracking-tight-2">How it works</h2>
      <ol className="mt-10 grid gap-px border border-black/12 bg-black/12 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map(([title, body], index) => <li key={title} className="bg-bg p-6"><p className="tabular text-micro font-semibold tracking-label text-brass">{String(index + 1).padStart(2, "0")}</p><h3 className="mt-3 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{body}</p></li>)}
      </ol>
    </section>

    <section className="border-y border-black/10 bg-surface">
      <div className="mx-auto grid max-w-[1180px] gap-12 px-6 py-[var(--section-space)] sm:px-8 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-[clamp(1.9rem,3.5vw,2.8rem)] leading-none tracking-tight-2">What it never does</h2>
          <ul className="mt-8 space-y-3 text-base leading-7">
            <li>Book, reserve, confirm or pay for you.</li>
            <li>Tick terms, declarations or consent boxes.</li>
            <li>Store or read card numbers, CVV codes, bank logins, partner passwords or one-time codes.</li>
            <li>Send your details to GlobTrek or to analytics.</li>
            <li>Run on websites you haven&apos;t allowed.</li>
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-[clamp(1.9rem,3.5vw,2.8rem)] leading-none tracking-tight-2">Permissions, plainly</h2>
          <dl className="mt-8 space-y-5 text-sm leading-6">
            <div><dt className="font-semibold">Storage</dt><dd className="text-muted">Keeps your details and trip checklist on your computer.</dd></div>
            <div><dt className="font-semibold">Scripting</dt><dd className="text-muted">Lets the assistant type your details into a partner&apos;s checkout form after you ask.</dd></div>
            <div><dt className="font-semibold">www.glob-trek.com</dt><dd className="text-muted">Lets this site know the assistant is installed and show each booking&apos;s status.</dd></div>
            <div><dt className="font-semibold">Partner sites, only when you allow them</dt><dd className="text-muted">Chrome asks the first time you fill a partner&apos;s page. You can remove access at any time.</dd></div>
          </dl>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-[1180px] px-6 py-[var(--section-space)] sm:px-8">
      <h2 className="font-serif text-[clamp(1.9rem,3.5vw,2.8rem)] leading-none tracking-tight-2">What it fills today</h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">We follow each partner&apos;s rules. Where a partner doesn&apos;t allow automated filling, the assistant opens the exact link and puts your details one click away.</p>
      <ul className="mt-8 divide-y divide-black/12 border-y border-black/12">
        {PARTNERS.map(([name, body, tag]) => <li key={name} className="grid gap-2 py-5 sm:grid-cols-[1fr_2fr_auto] sm:items-baseline sm:gap-8"><p className="font-medium">{name}</p><p className="text-sm leading-6 text-muted">{body}</p><p className="text-micro uppercase tracking-label">{tag}</p></li>)}
      </ul>
      <p className="mt-8 text-xs leading-5 text-subtle">GlobTrek is a Booking.com affiliate partner and may earn a commission on qualifying bookings made through its links; your price doesn&apos;t change. The assistant opens the same links as the trip page and only when you click. <Link href="/affiliate-disclosure" className="underline decoration-black/25 underline-offset-2">Affiliate disclosure</Link> · <Link href="/booking-assistant/privacy" className="underline decoration-black/25 underline-offset-2">Assistant privacy policy</Link> · <Link href="/help" className="underline decoration-black/25 underline-offset-2">Help</Link></p>
    </section>
    <SiteFooter />
  </main>;
}
