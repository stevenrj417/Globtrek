import { travelInfoFor } from "../../data/travelInfo";

function title(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s&'-])\S/g, (letter) => letter.toUpperCase());
}

const external = "inline-flex min-h-11 items-center underline decoration-black/30 underline-offset-4 hover:decoration-black";

// Entry and safety, folded away. An off-season warning always stays visible.
export function BeforeYouGo({ trip, seasonWarning }) {
  const info = travelInfoFor(trip.country);
  if (!info && !seasonWarning) return null;
  return <section id="before-you-go" aria-label="Travel essentials" className="scroll-mt-24 px-6 py-6 sm:px-12">
    <div className="mx-auto max-w-[1180px]">
      {seasonWarning ? <p role="note" className="mb-4 border-l-2 border-warning pl-3 text-sm leading-6">Outside the usual season for {title(trip.city)}. Check weather and opening hours.</p> : null}
      {info ? <details className="group border-y border-black/12">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-medium">Travel essentials <span aria-hidden="true" className="text-black/50 transition-transform duration-200 group-open:rotate-45">+</span></summary>
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
