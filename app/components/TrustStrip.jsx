// Three plain promises, each one true of every GlobTrek trip.
const PROMISES = [
  ["Free to plan", "No account needed and no GlobTrek fees, ever."],
  ["You book direct", "Rooms, flights and tickets are booked and paid on Booking.com or with the operator, never through us."],
  ["Prices with receipts", "Every estimate says what it's built on and when we checked it."],
];

export function TrustStrip({ className = "" }) {
  return <ul className={`grid gap-px bg-black/10 sm:grid-cols-3 ${className}`} aria-label="Why travelers trust GlobTrek">
    {PROMISES.map(([title, body]) => <li key={title} className="bg-bg py-5 sm:px-6 sm:first:pl-0">
      <p className="text-micro font-semibold uppercase tracking-label">{title}</p>
      <p className="mt-2 text-sm leading-6">{body}</p>
    </li>)}
  </ul>;
}
