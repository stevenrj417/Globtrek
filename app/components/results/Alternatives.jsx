"use client";

import Image from "next/image";

function money(value) {
  return `$${Math.round(value || 0).toLocaleString("en-US")}`;
}

function title(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s&'-])\S/g, (letter) => letter.toUpperCase());
}

// How an alternative differs from the trip on screen, from structured data only.
export function compareToCurrent(alternative, current, answers = {}) {
  const notes = [];
  const difference = alternative.budgetPlan.budgetCheckTotal - current.budgetPlan.budgetCheckTotal;
  if (Math.abs(difference) >= 25) notes.push(difference < 0 ? `${money(-difference)} less` : `${money(difference)} more`);
  const altHours = alternative.travelFeasibility?.estimatedDoorToDestinationTime;
  const curHours = current.travelFeasibility?.estimatedDoorToDestinationTime;
  if (Number.isFinite(altHours) && Number.isFinite(curHours) && Math.abs(altHours - curHours) >= 2) notes.push(altHours < curHours ? "Shorter travel day" : "Longer travel day");
  const interest = answers.luxury;
  if (interest && alternative.tags?.includes(interest) && !current.tags?.includes(interest)) notes.push(`Matches your ${interest.toLowerCase()} interest`);
  if (Number.isFinite(alternative.recognition) && Number.isFinite(current.recognition) && Math.abs(alternative.recognition - current.recognition) >= 15) notes.push(alternative.recognition < current.recognition ? "Less well-known" : "Better known");
  return notes.length ? notes : ["Similar cost and fit"];
}

export function Alternatives({ alternatives, current, answers }) {
  if (!alternatives?.length) return null;
  return <section id="alternatives" aria-labelledby="alternatives-heading" className="scroll-mt-24 border-t border-black/15 px-6 py-10 sm:px-12">
    <div className="mx-auto max-w-[1180px]">
      <h2 id="alternatives-heading" className="font-serif text-[clamp(1.8rem,3vw,2.5rem)] leading-[.95] tracking-tight-2">Other trips that fit your answers</h2>
      <p className="mt-2 max-w-2xl text-sm text-black/65">Each one passed the same checks as your match. They ranked lower on how well they fit your answers.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">{alternatives.map((item) => {
        const key = item.id || item.airport;
        return <li key={key} className="flex flex-col border border-black/15 bg-white">
          <div className="relative aspect-[16/10] bg-placeholder">{item.image ? <Image src={item.image} alt={item.imageAlt || `${title(item.city)}, ${title(item.country)}`} fill sizes="(min-width:640px) 30vw, 100vw" className="object-cover" /> : null}</div>
          <div className="flex flex-1 flex-col p-4">
            <h3 className="font-serif text-xl leading-tight">{title(item.city)}<span className="block font-sans text-xs text-black/55">{title(item.country)}</span></h3>
            <p className="tabular mt-2 text-sm">{money(item.budgetPlan.budgetCheckTotal)} estimated</p>
            <ul className="mt-2 space-y-1 text-xs text-black/70">{compareToCurrent(item, current, answers).map((note) => <li key={note}>· {note}</li>)}</ul>
            {/* A full page load: the results page reads its destination once, on load. */}
            <a href={`/results?destination=${encodeURIComponent(key)}`} className="mt-auto inline-flex min-h-11 items-center pt-3 text-sm underline decoration-black/30 underline-offset-4 hover:decoration-ink">See this trip <span aria-hidden="true" className="ml-1">→</span></a>
          </div>
        </li>;
      })}</ul>
    </div>
  </section>;
}
