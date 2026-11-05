import Link from "next/link";
import { BrandWordmark } from "./BrandMark";
import { AccountEntry } from "./AccountEntry";
import { DestinationSearch } from "./DestinationSearch";
import { ProductMenu } from "./ProductMenu";
import { CurrentYear, MobileMenu, NavLinks, StickyHeader } from "./HeaderClient";
import { CONTACT_EMAIL, INSTAGRAM_URL, LEGAL_NAME } from "../lib/site";
import { BookingLogo } from "./PartnerLogo";
import { BookingPartnerBadge } from "./PartnerLogo";

const navigation = [["Trips", "/#trips"], ["Quiz", "/discover"], ["Destinations", "/destinations"], ["How it works", "/how-it-works"], ["About", "/about"]];

const footerGroups = [
  ["Plan", [["Find my trip", "/discover"], ["Destinations", "/destinations"], ["How it works", "/how-it-works"]]],
  ["Company", [["About", "/about"], ["Help", "/help"], ["Contact", "/contact"]]],
  ["Policies", [["Privacy", "/privacy"], ["Terms", "/terms"], ["Affiliate disclosure", "/affiliate-disclosure"]]],
];

export function SiteHeader({ actionHref = "/discover", actionLabel = "Find my trip" }) {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <StickyHeader>
        <nav aria-label="Primary navigation">
          <div className="mx-auto flex h-[var(--header-height)] max-w-[1900px] items-center justify-between gap-5 px-5 sm:px-8">
            <ProductMenu />
            <NavLinks items={navigation} />
            <div className="flex items-center gap-4 sm:gap-5">
              <DestinationSearch />
              <AccountEntry />
              <Link className="btn btn-primary hidden min-h-11 shrink-0 sm:inline-flex" href={actionHref}>{actionLabel}</Link>
              <MobileMenu items={navigation} actionHref={actionHref} actionLabel={actionLabel} />
            </div>
          </div>
        </nav>
      </StickyHeader>
      <span id="main" tabIndex={-1} className="sr-only" />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-surface-sunken py-14 text-ink sm:py-16">
      <div className="mx-auto max-w-[1700px] px-6 sm:px-8">
        <div className="flex flex-col justify-between gap-12 lg:flex-row">
          <div>
            <BrandWordmark className="text-3xl font-bold tracking-tight-4 sm:text-4xl" />
            <p className="mt-5 max-w-md text-sm leading-6 text-muted">A few quick questions. One affordable trip.</p>
            <p className="mt-3 text-sm text-muted">Stays, flights and attractions booked on <BookingLogo className="h-3.5 w-auto" /></p>
            <BookingPartnerBadge className="mt-5" />
            <ul className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
              <li><a href={INSTAGRAM_URL} rel="me noopener" className="inline-flex min-h-11 items-center gap-2 transition-colors duration-150 hover:text-ink"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>Instagram</a></li>
              {CONTACT_EMAIL ? <li><a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex min-h-11 items-center transition-colors duration-150 hover:text-ink">{CONTACT_EMAIL}</a></li> : null}
            </ul>
          </div>
          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-16 gap-y-10 sm:grid-cols-3">
            {footerGroups.map(([group, links]) => (
              <div key={group}>
                <p className="eyebrow">{group}</p>
                <ul className="mt-4 space-y-3 text-sm text-muted">
                  {links.map(([label, href]) => <li key={label}><Link className="transition-colors duration-150 hover:text-ink" href={href}>{label}</Link></li>)}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-black/10 pt-6 text-xs leading-5 text-subtle sm:flex-row sm:items-start sm:justify-between">
          <p className="tabular">© <CurrentYear /> {LEGAL_NAME}</p>
          <p className="max-w-2xl sm:text-right">
            GlobTrek is a Booking.com affiliate partner and may earn a commission on qualifying bookings. Your price doesn&apos;t change. <Link href="/affiliate-disclosure" className="underline decoration-black/25 hover:decoration-black">How this works</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
