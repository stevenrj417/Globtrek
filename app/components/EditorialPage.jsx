import Image from "next/image";
import { SiteFooter, SiteHeader } from "./SiteChrome";

function formatUpdated(value) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

// Shared layout for the quieter pages: a serif headline, an optional photo beside
// it, then sections with the heading on the left and the text on the right.
export function EditorialPage({ eyebrow, title, intro, updated, image, imageAlt = "", children }) {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <article className="mx-auto max-w-[1400px] px-6 sm:px-8">
        <header className={`grid gap-10 pb-14 pt-14 sm:pb-20 sm:pt-24 ${image ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16" : ""}`}>
          <div className="max-w-3xl">
            {eyebrow ? <p className="text-micro uppercase tracking-editorial text-subtle">{eyebrow}</p> : null}
            <h1 className="mt-5 text-balance font-serif text-[clamp(2.5rem,5.4vw,5rem)] font-normal leading-[1.02] tracking-tight-2">
              {title}
            </h1>
            {intro ? <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{intro}</p> : null}
            {updated ? <p className="mt-6 text-sm text-subtle">Last updated <time dateTime={updated}>{formatUpdated(updated)}</time></p> : null}
          </div>
          {image ? (
            <div className="relative aspect-[4/3] overflow-hidden bg-placeholder">
              <Image src={image} alt={imageAlt} fill priority className="image-calm object-cover" sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
          ) : null}
        </header>
        <div className="legal-copy border-t border-black/10 pb-20 pt-4 sm:pb-28">{children}</div>
      </article>
      <SiteFooter />
    </main>
  );
}

export function EditorialSection({ number, title, children }) {
  return (
    <section className="grid gap-4 border-b border-black/10 py-10 last:border-b-0 sm:py-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
      <h2 className="font-serif text-2xl font-normal leading-tight tracking-tight-1 sm:text-[1.75rem]">
        {number ? <span className="tabular mb-2 block font-sans text-micro tracking-label text-subtle">{number}</span> : null}
        {title}
      </h2>
      <div className="max-w-2xl space-y-4 text-base leading-7 text-muted sm:text-[17px] sm:leading-8">
        {children}
      </div>
    </section>
  );
}
