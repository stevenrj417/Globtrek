// Display formatting shared by server and client components. No heavy imports here.

export function formatMoney(value) {
  return `$${Math.round(Number(value) || 0).toLocaleString("en-US")}`;
}

// "$1,000–$2,300": en dash, no spaces, thousands separator, no decimals.
export function formatRange(low, high) {
  return low === high ? formatMoney(low) : `${formatMoney(low)}–${formatMoney(high)}`;
}

export function formatNights(nights) {
  return nights === 7 ? "1 week" : `${nights} night${nights === 1 ? "" : "s"}`;
}

// "Est. $1,000–$2,300 · 2 travelers · 1 week · before flights"
export function estimateLine(estimate) {
  return `Est. ${formatRange(estimate.low, estimate.high)} · ${estimate.travelers} traveler${estimate.travelers === 1 ? "" : "s"} · ${formatNights(estimate.nights)} · before flights`;
}
