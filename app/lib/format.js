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

// Wikimedia originals can be huge; request one of its standard thumbnail widths instead.
export function sizedPhoto(url, width = 1280) {
  const match = String(url || "").match(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/([^?#/]+)/);
  if (!match) return url;
  const [, a, b, file] = match;
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${a}/${b}/${file}/${width}px-${file}${/\.svg$/i.test(file) ? ".png" : ""}`;
}

// Lowercase a style phrase for a sentence, keeping proper names ("French Quarter",
// "Atlantic light", "Cuban food") capitalized.
const PROPER = /^(Atlantic|French|Creole|Cuban|Yucatecan|Hollywood|Renaissance|Mexican|Japanese|Thai|Italian|Spanish|Greek|Roman|Alpine|Andean|Mayan|Aztec|Moorish|Malecón)\b/;
export function sentencePhrase(part) {
  const value = String(part || "").trim();
  return PROPER.test(value) ? value : value.charAt(0).toLowerCase() + value.slice(1);
}
