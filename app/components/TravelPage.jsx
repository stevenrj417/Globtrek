import Image from "./Photo";
import Link from "next/link";

// Shared building blocks for destination and guide pages, in the homepage's
// style: full-photo hero with a serif title, serif section headings, photo
// cards with labels, and quiet surface panels.

export const textLink = "underline decoration-black/25 underline-offset-4 hover:decoration-ink";
const chipClass = "tabular bg-surface/92 px-2.5 py-1 text-micro font-semibold uppercase tracking-caps text-ink backdrop-blur-sm";

export function Chip({ children, dark = false }) {
  return <span className={dark ? "tabular bg-ink px-2.5 py-1 text-micro font-semibold uppercase tracking-caps text-white" : chipClass}>{children}</span>;
}

export function Breadcrumb({ items, width = "max-w-[1280px]" }) {
  return <div className={`mx-auto px-5 pt-6 sm:px-8 ${width}`}>
    <nav aria-label="Breadcrumb" className="text-sm text-subtle">
      {items.map(([label, href], index) => <span key={label}>
        {index ? <span aria-hidden="true"> › </span> : null}
        {index === items.length - 1 ? <span aria-current="page" className="text-ink">{label}</span> : href ? <Link href={href} className="hover:text-ink">{label}</Link> : label}
      </span>)}
    </nav>
  </div>;
}

export function PhotoCredit({ credit }) {
  if (!credit?.artist) return null;
  return <p className="absolute bottom-2 right-3 max-w-[60%] truncate text-[10px] text-white">Photo: {credit.source ? <a href={credit.source} target="_blank" rel="noopener" className="underline decoration-white/40 underline-offset-2 hover:text-white">{credit.artist}</a> : credit.artist}{credit.license ? <>, {credit.licenseUrl ? <a href={credit.licenseUrl} target="_blank" rel="noopener" className="underline decoration-white/40 underline-offset-2 hover:text-white">{credit.license}</a> : credit.license}</> : null}</p>;
}

// Full-width photo with the title over it, like the homepage hero.
// unoptimized: load the photo straight from its source (Google Places photos must not be copied into our image cache).
export function PageHero({ image, alt, title, chips = [], credit, subtitle, centered = false, short = false, unoptimized = false }) {
  return <section className="px-4 pt-4 sm:px-6">
    <div className={`relative mx-auto max-w-[1880px] overflow-hidden bg-placeholder ${short ? "min-h-[48svh] sm:min-h-[56svh]" : "min-h-[58svh] sm:min-h-[66svh]"}`}>
      {image ? <Image src={image} alt={alt} fill priority fetchPriority="high" className="image-calm object-cover" sizes="(min-width: 1880px) 1880px, 100vw" quality={80} unoptimized={unoptimized} /> : null}
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/75 via-black/30 to-transparent" aria-hidden="true" />
      <div className={`rise absolute inset-x-0 bottom-0 mx-auto max-w-[1280px] px-5 pb-10 sm:px-8 sm:pb-14 ${centered ? "flex flex-col items-center text-center" : ""}`}>
        {chips.length ? <div className={`flex flex-wrap gap-1.5 ${centered ? "justify-center" : ""}`}>{chips.map((chip) => <Chip key={chip}>{chip}</Chip>)}</div> : null}
        <h1 className="mt-4 max-w-4xl text-balance font-serif text-[clamp(2.6rem,6.5vw,6rem)] font-normal leading-[0.95] tracking-tight-3 text-white [text-shadow:0_2px_24px_rgba(0,0,0,.35)]">{title}</h1>
        {subtitle ? <p className="mt-4 max-w-xl text-base leading-7 text-white/90 sm:text-lg">{subtitle}</p> : null}
      </div>
      <PhotoCredit credit={credit} />
    </div>
  </section>;
}

// The answer up top, with the key numbers in a panel beside it.
export function Summary({ eyebrow = "The short answer", lines = [], facts = [], jump = [], children }) {
  return <section aria-label={eyebrow} className={`mx-auto mt-10 grid max-w-[1280px] gap-10 px-5 sm:mt-12 sm:px-8 ${facts.length ? "lg:grid-cols-[1.25fr_1fr] lg:gap-16" : ""}`}>
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <div className="mt-3 max-w-2xl space-y-2 text-base leading-7 text-ink sm:text-lg sm:leading-8">
        {lines.map((line) => <p key={line}>{line}</p>)}
      </div>
      {children}
      {jump.length ? <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2">
        {jump.map(([href, label]) => <a key={href} href={`#${href}`} className="inline-flex min-h-10 items-center border border-black/15 px-4 text-micro font-medium uppercase tracking-label transition-colors hover:border-ink">{label}</a>)}
      </nav> : null}
    </div>
    {facts.length ? <dl className="self-start divide-y divide-black/10 bg-surface px-6 sm:px-8">
      {facts.map(([label, value, note]) => <div key={label} className="py-5">
        <dt className="eyebrow">{label}</dt>
        <dd className="tabular mt-1 text-2xl font-medium tracking-tight-2">{value}</dd>
        {note ? <dd className="mt-0.5 text-xs text-subtle">{note}</dd> : null}
      </div>)}
    </dl> : null}
  </section>;
}

export function Section({ id, title, children, intro, eyebrow, width = "max-w-[1280px]" }) {
  return <section id={id?.replace(/-heading$/, "")} aria-labelledby={id} className={`reveal mx-auto mt-[var(--section-space)] scroll-mt-24 px-5 sm:px-8 ${width}`}>
    {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
    <h2 id={id} className="font-serif text-3xl font-normal tracking-tight-3 sm:text-5xl">{title}</h2>
    {intro ? <p className="mt-4 max-w-[var(--width-reading)] text-base leading-7 text-muted">{intro}</p> : null}
    {children}
  </section>;
}

export function Stars({ rating, reviews, source = "" }) {
  if (!rating) return null;
  return <span className="tabular">★ {rating}{source}{reviews ? ` · ${Number(reviews).toLocaleString("en-US")} reviews` : ""}</span>;
}

// Restaurants as a numbered list: name, kind, price and rating tags, a map link.
export function NumberedPlaces({ places, linkLabel = "Map and hours ↗" }) {
  return <ol className="mt-10 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
    {places.map((place, index) => <li key={place.key || place.name} className="flex gap-5 border-t border-black/10 py-6">
      <span aria-hidden="true" className="tabular font-serif text-4xl leading-none text-subtle">{String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0">
        <p className="text-lg font-medium leading-snug tracking-tight-1">{place.name}</p>
        {place.category ? <p className="mt-1 text-sm text-muted">{place.category}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          {place.price ? <span className="tabular border border-black/15 px-2 py-0.5">{place.price}</span> : null}
          {place.rating ? <span className="border border-black/15 px-2 py-0.5"><Stars rating={place.rating} reviews={place.reviewCount} /></span> : null}
          {(place.tags || []).map((tag) => <span key={tag} className="border border-black/15 px-2 py-0.5">{tag}</span>)}
        </div>
        {place.note ? <p className="mt-2 text-xs text-subtle">{place.note}</p> : null}
        {place.href ? <a href={place.href} target="_blank" rel="noopener" className={`mt-3 inline-block text-sm ${textLink}`}>{place.linkLabel || linkLabel}</a> : null}
      </div>
    </li>)}
  </ol>;
}

// Places as photo cards (photo, name, rating, map link). Places without a photo
// get a quiet panel with the name instead of a stock picture.
export function PhotoPlaces({ places }) {
  return <ul className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 lg:grid-cols-3">
    {places.map((place) => <li key={place.key || place.name} className="flex w-[78%] shrink-0 snap-start flex-col sm:w-auto">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        <a href={place.href} target="_blank" rel="noopener" tabIndex={-1} aria-hidden="true" className="group absolute inset-0">
          {place.photo ? <Image src={place.photo.url} alt="" fill className="image-calm object-cover transition-transform duration-500 group-hover:scale-[1.02]" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 80vw" /> : <span className="grid h-full place-items-center p-8 text-center font-serif text-2xl leading-tight text-subtle">{place.name}</span>}
        </a>
        {place.eyebrow ? <div className="pointer-events-none absolute left-3 top-3"><Chip>{place.eyebrow}</Chip></div> : null}
        {place.photo ? <PhotoCredit credit={place.photo} /> : null}
      </div>
      <a href={place.href} target="_blank" rel="noopener" className="mt-4 text-lg font-medium leading-snug tracking-tight-1 hover:underline">{place.name}</a>
      <p className="mt-1 flex items-center justify-between gap-3 text-sm text-muted">{place.rating ? <Stars rating={place.rating} reviews={place.reviewCount} /> : <span />}<span>{place.linkLabel || "Map ↗"}</span></p>
    </li>)}
  </ul>;
}

// Things to do as tiles that open the map (or tickets).
export function PlaceTiles({ places }) {
  return <ul className="mt-10 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
    {places.map((place) => <li key={place.key || place.name} className="bg-bg">
      <a href={place.href} target="_blank" rel={place.sponsored ? "noopener sponsored" : "noopener"} className="group flex h-full flex-col justify-between gap-6 p-6 transition-colors hover:bg-surface">
        <div>
          {place.eyebrow ? <p className="eyebrow">{place.eyebrow}</p> : null}
          <p className="mt-2 text-lg font-medium leading-snug tracking-tight-1">{place.name}</p>
          {place.description ? <p className="mt-2 line-clamp-3 text-sm text-muted">{place.description}</p> : null}
        </div>
        <p className="flex items-center justify-between gap-3 text-sm text-muted">{place.rating ? <Stars rating={place.rating} reviews={place.reviewCount} /> : <span>{place.linkLabel || "Map"}</span>}<span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">↗</span></p>
      </a>
    </li>)}
  </ul>;
}

// The dark call-to-action band.
export function CtaBand({ eyebrow, title, body, href, label }) {
  return <section className="reveal mx-auto mt-[var(--section-space)] max-w-[1280px] px-5 sm:px-8">
    <div className="bg-ink px-6 py-14 text-white sm:px-14 sm:py-20">
      {eyebrow ? <p className="text-micro font-semibold uppercase tracking-caps text-white">{eyebrow}</p> : null}
      <h2 className="mt-3 max-w-2xl font-serif text-[clamp(2rem,4.5vw,3.75rem)] font-normal leading-[1.02] tracking-tight-3">{title}</h2>
      {body ? <p className="mt-4 max-w-xl text-white">{body}</p> : null}
      <Link href={href} className="mt-8 inline-flex min-h-12 min-w-[13rem] items-center justify-center gap-2 bg-white px-7 text-micro font-medium uppercase tracking-label text-black transition-opacity hover:opacity-90">{label} <span aria-hidden="true">→</span></Link>
    </div>
  </section>;
}

// A horizontal swipe row on phones, a grid from small screens up.
export function CardRow({ children, columns = "lg:grid-cols-4" }) {
  return <div className={`-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 sm:overflow-visible sm:px-0 ${columns}`}>
    {children}
  </div>;
}

export function CardRowItem({ children }) {
  return <div className="flex w-[78%] shrink-0 snap-start flex-col sm:w-auto">{children}</div>;
}
