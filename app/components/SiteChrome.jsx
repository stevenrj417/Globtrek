import Link from "next/link";
import { BrandWordmark } from "./BrandMark";
import { AccountEntry } from "./AccountEntry";
import { DestinationSearch } from "./DestinationSearch";
import { ProductMenu } from "./ProductMenu";

const navigation = [["Trips", "/#trips"], ["Quiz", "/discover"], ["How it works", "/how-it-works"], ["About", "/about"]];

const footerLinks = [
  ["Discover", "/#discover"],
  ["Quiz", "/discover"],
  ["How It Works", "/how-it-works"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Affiliate Disclosure", "/affiliate-disclosure"],
];

export function SiteHeader({ actionHref = "/discover", actionLabel = "Find my trip" }) {
  return (
    <header className="bg-bg text-ink">
      <nav aria-label="Primary navigation" className="border-b border-black/10">
        <div className="mx-auto flex min-h-20 max-w-[1900px] items-center justify-between gap-5 px-5 sm:px-8">
          <ProductMenu />
          <div className="hidden items-center gap-9 text-xs font-medium text-muted lg:flex">
            {navigation.map(([label, href]) => (
              <Link className="transition hover:text-black focus-visible:text-black" href={href} key={label}>
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-5"><DestinationSearch /><AccountEntry /><Link
            className="hidden min-h-11 shrink-0 items-center bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-caps text-white transition hover:bg-black sm:inline-flex"
            href={actionHref}
          >
            {actionLabel}
          </Link></div>
        </div>
        <div className="flex gap-7 overflow-x-auto border-t border-black/10 px-5 py-3.5 text-xs font-medium text-muted lg:hidden" aria-label="Mobile navigation">
          {navigation.map(([label, href]) => (
            <Link className="shrink-0" href={href} key={label}>
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-surface-sunken py-14 text-ink sm:py-16">
      <div className="mx-auto max-w-[1700px] px-6 sm:px-8">
        <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div>
            <BrandWordmark className="text-3xl font-bold tracking-tight-4 sm:text-4xl" />
            <p className="mt-5 max-w-md text-sm leading-6 text-muted">
              The simple way to find a trip that fits.
            </p>
          </div>
          <nav aria-label="Footer navigation" className="flex max-w-3xl flex-wrap gap-x-7 gap-y-4 text-xs text-muted">
            {footerLinks.map(([label, href]) => (
              <Link className="transition hover:text-black" href={href} key={label}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-black/10 pt-6 text-xs leading-5 text-subtle sm:flex-row sm:items-start sm:justify-between">
          <p>© 2026 GlobTrek</p>
          <p className="max-w-2xl sm:text-right">
            Travel recommendations and booking links may be provided through third-party travel services.
          </p>
        </div>
      </div>
    </footer>
  );
}
