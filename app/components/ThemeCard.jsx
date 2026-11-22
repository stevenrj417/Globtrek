import Image from "./Photo";
import Link from "next/link";
import { formatMoney } from "../lib/format";

// A themed trip or expedition as a card, in the same style as GlobTrek's trip cards.
export function ThemeCard({ card, sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 85vw", eager = false }) {
  return <article className="group relative flex h-full flex-col">
    <Link href={card.href} className="block">
      <div className="relative aspect-[4/5] overflow-hidden bg-placeholder">
        {card.image ? <Image src={card.image} alt={card.imageAlt} fill className="image-calm object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes={sizes} quality={75} loading={eager ? "eager" : "lazy"} /> : null}
        {card.chips?.length ? <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{card.chips.map((chip) => <span key={chip} className="tabular bg-surface/92 px-2.5 py-1 text-micro font-semibold uppercase tracking-caps text-ink backdrop-blur-sm">{chip}</span>)}</div> : null}
      </div>
      <div className="mt-4 text-center">
        <h3 className="text-balance text-xl font-medium tracking-tight-2">{card.title}</h3>
        {card.place ? <p className="mt-1 text-xs">{card.place}</p> : null}
        {card.landFrom ? <p className="tabular mt-3 text-sm font-medium">From {formatMoney(card.landFrom)} a person, before flights</p> : null}
      </div>
    </Link>
    <div className="mt-3 border-b border-black/10" aria-hidden="true" />
  </article>;
}
