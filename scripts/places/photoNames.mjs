// Name matching for free place photos (scripts/places/match-free-photos.mjs).
const STOP = new Set(["the", "of", "de", "del", "la", "le", "el", "los", "las", "and", "y", "et", "di", "da", "du", "des", "restaurant", "restaurante", "museum", "museo", "park", "parque", "national", "city", "a", "an", "at", "in", "st", "saint", "san", "santa"]);
export const words = (value) => String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\(.*?\)/g, " ").split(/[^a-z0-9]+/).filter((word) => word.length > 1 && !STOP.has(word));

// Every meaningful word of the shorter name appears in the longer one.
export function nameMatch(place, label) {
  const a = words(place);
  const b = words(label);
  if (!a.length || !b.length) return false;
  const shared = a.filter((word) => b.includes(word)).length;
  return shared >= Math.min(a.length, b.length) && (shared >= 2 || (a.length === 1 && b.length === 1));
}

// As nameMatch, and the longer name adds at most one meaningful word, so
// "Angel of Independence" matches "The Angel of Independence" but a mural
// titled "Dream of a Sunday Afternoon in Alameda Central" doesn't match the park.
export function strictNameMatch(place, label) {
  if (!nameMatch(place, label)) return false;
  return Math.abs(words(place).length - words(label).length) <= 1;
}
