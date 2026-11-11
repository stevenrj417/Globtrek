import Image from "./Photo";
import Link from "next/link";
import { EstimateDetails } from "./EstimateDetails";
import { estimateLine, formatNights } from "../lib/recommendation/tripEstimate";

export function TripCard({ trip, href, sizes = "(min-width: 768px) 33vw, 85vw", priority = false }) {
  return (
    <article className="group relative flex h-full flex-col">
      <Link href={href} className="block" aria-label={`Plan a ${trip.name} trip`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-placeholder">
          <Image src={trip.image} alt={trip.alt} fill className="image-calm object-cover" sizes={sizes} quality={80} priority={priority} />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="bg-surface/92 px-2.5 py-1 text-micro font-semibold uppercase tracking-caps text-ink backdrop-blur-sm tabular">{formatNights(trip.estimate.nights)}</span>
            {trip.vibe ? <span className="bg-surface/92 px-2.5 py-1 text-micro font-semibold uppercase tracking-caps text-ink backdrop-blur-sm">{trip.vibe}</span> : null}
          </div>
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-xl font-medium tracking-tight-2 sm:text-2xl">{trip.name}</h3>
          <p className="mt-1 text-xs text-subtle">{trip.country}</p>
          <p className="tabular mt-3 text-sm font-medium">{estimateLine(trip.estimate).split(" · ")[0]}</p>
          <p className="tabular mt-1 text-xs text-subtle">{estimateLine(trip.estimate).split(" · ").slice(1).join(" · ")}</p>
        </div>
      </Link>
      <div className="mt-1 flex justify-center border-b border-black/10 pb-3">
        <EstimateDetails estimate={trip.estimate} />
      </div>
    </article>
  );
}
