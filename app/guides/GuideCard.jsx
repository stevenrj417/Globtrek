import Image from "../components/Photo";
import Link from "next/link";

// A guide as a card, in the same style as the homepage trip cards.
export function GuideCard({ card, sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 85vw", eager = false }) {
  return (
    <article className="group relative flex h-full flex-col">
      <Link href={`/guides/${card.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-placeholder">
          <Image src={card.image} alt={card.imageAlt} fill className="image-calm object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes={sizes} quality={75} loading={eager ? "eager" : "lazy"} />
          {card.chips.length ? <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {card.chips.map((chip) => <span key={chip} className="tabular bg-surface/92 px-2.5 py-1 text-micro font-semibold uppercase tracking-caps text-ink backdrop-blur-sm">{chip}</span>)}
          </div> : null}
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-balance text-xl font-medium tracking-tight-2">{card.title}</h3>
          {card.place ? <p className="mt-1 text-xs text-subtle">{card.place}</p> : null}
          {card.meta ? <p className="tabular mt-3 text-sm font-medium">{card.meta}</p> : null}
        </div>
      </Link>
      <div className="mt-3 border-b border-black/10" aria-hidden="true" />
    </article>
  );
}
