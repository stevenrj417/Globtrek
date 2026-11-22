import { travelInfoFor } from "../../data/travelInfo";

function title(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s&'-])\S/g, (letter) => letter.toUpperCase());
}

const external = "inline-flex min-h-11 items-center underline decoration-black/30 underline-offset-4 hover:decoration-black";

// Entry and safety, folded away. An off-season warning always stays visible.
export function BeforeYouGo({ trip, seasonWarning }) {
  const info = travelInfoFor(trip.country);
  if (!info && !seasonWarning) return null;
  return <section id="before-you-go" aria-label="Travel essentials" className="scroll-mt-24 px-6 pb-14 sm:px-12 sm:pb-20">
    <div className="mx-auto max-w-[1180px]">
      {seasonWarning ? <p role="note" className="mb-4 border-l-2 border-warning pl-3 text-sm leading-6">Outside the usual season for {title(trip.city)}. Check weather and opening hours.</p> : null}
      {info ? <details className="group -mt-px border-y border-black/10">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden"><span><span className="block font-serif text-2xl leading-tight tracking-tight-2">Travel essentials</span><span className="mt-1 block text-xs text-subtle">{info.domestic ? "ID you need to fly" : `Entry rules and travel advisory for ${title(trip.country)}`}</span></span><span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center border border-black/15 text-xl"><span className="inline-block transition-transform duration-200 group-open:rotate-45">+</span></span></summary>
        <div className="pb-5 text-sm leading-6">
          {info.domestic
            ? <p>No passport needed for U.S. travelers; bring a REAL ID or other <a href="https://www.tsa.gov/travel/security-screening/identification" target="_blank" rel="noopener" className="underline underline-offset-4">TSA-accepted ID<span className="sr-only"> (opens in a new tab)</span></a>.</p>
            : <>
              <p>Entry rules depend on your passport. Check before you book.</p>
              <ul className="mt-1 flex flex-wrap gap-x-6">
                {info.usCitizensUrl ? <li><a href={info.usCitizensUrl} target="_blank" rel="noopener" className={external}>{info.usCitizensLabel}<span className="sr-only"> (opens in a new tab)</span> ↗</a></li> : null}
                <li><a href={info.entryUrl} target="_blank" rel="noopener" className={external}>{info.entryLabel}<span className="sr-only"> (opens in a new tab)</span> ↗</a></li>
                <li><a href={info.advisoryUrl} target="_blank" rel="noopener" className={external}>{info.advisoryLabel}<span className="sr-only"> (opens in a new tab)</span> ↗</a></li>
              </ul>
            </>}
        </div>
      </details> : null}
    </div>
  </section>;
}
