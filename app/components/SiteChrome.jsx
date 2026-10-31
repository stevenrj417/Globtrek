import Link from "next/link";
import { BrandWordmark } from "./BrandMark";
import { AccountEntry } from "./AccountEntry";
import { DestinationSearch } from "./DestinationSearch";
import { ProductMenu } from "./ProductMenu";
import { CurrentYear, MobileMenu, NavLinks, StickyHeader } from "./HeaderClient";

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
          <p className="tabular">© <CurrentYear /> GlobTrek</p>
          <p className="max-w-2xl sm:text-right">
            GlobTrek may earn a commission when you book through partner links. Your price doesn&apos;t change. <Link href="/affiliate-disclosure" className="underline decoration-black/25 hover:decoration-black">How this works</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
