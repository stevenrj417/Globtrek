// Decides what the results page shows. Source of truth, highest first:
//
// 1. A shared trip link (?trip=…) carries its own quiz, destination and chosen
//    stay. Nothing saved in this browser can change it, so the same link shows
//    the same trip to everyone.
// 2. A direct destination link (?destination=HAN) always shows that destination.
//    The traveler's saved quiz still supplies their preferences (airport, dates,
//    budget), but it never swaps the destination for another one.
// 3. No link parameters: the saved quiz and its best match.
// 4. Nothing saved: GlobTrek's defaults.
//
// A chosen stay saved in this browser is used only for case 2 or 3, and only
// when it was chosen for the same destination.

export const DEFAULT_QUIZ = Object.freeze({ answers: {} });

// Readable ?trip= links (made before encrypted share links, November 11, 2026)
// carry no date of their own, so they all stop opening on this day, 90 days
// after the change, the same lifetime as an encrypted link.
export const LEGACY_TRIP_LINKS_UNTIL = "2027-02-09";

export function legacyTripLinksOpen(now = new Date()) {
  return now.toISOString().slice(0, 10) < LEGACY_TRIP_LINKS_UNTIL;
}

export function encodeSharedTrip(trip) {
  const bytes = new TextEncoder().encode(JSON.stringify(trip));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function decodeSharedTrip(value) {
  if (typeof value !== "string" || !value || value.length > 12000) return null;
  try {
    const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
    const trip = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0))));
    return trip && typeof trip === "object" && !Array.isArray(trip) ? trip : null;
  } catch {
    return null;
  }
}

function parseJson(raw) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

const cleanId = (value) => (typeof value === "string" && /^[A-Za-z0-9_-]{2,80}$/.test(value) ? value : null);

// search: the page's query string; savedQuiz / savedStay: raw localStorage values.
export function resolveResultsState({ search = "", savedQuiz = null, savedStay = null, now = new Date() } = {}) {
  const params = new URLSearchParams(search);
  if (params.get("trip") && !legacyTripLinksOpen(now)) return { source: "legacy_expired", quiz: DEFAULT_QUIZ, destinationId: null, stayId: null, useSavedStay: false };
  const shared = params.get("trip") ? decodeSharedTrip(params.get("trip")) : null;
  if (shared?.quiz && typeof shared.quiz === "object") {
    return { source: "shared", quiz: shared.quiz, destinationId: cleanId(shared.destination), stayId: cleanId(shared.stay) || null, useSavedStay: false };
  }
  const stored = parseJson(savedQuiz);
  const quiz = stored || DEFAULT_QUIZ;
  const destinationId = cleanId(params.get("destination"));
  const stay = parseJson(savedStay);
  const stayFits = Boolean(stay?.destinationId && stay.destinationId === destinationId);
  if (destinationId) return { source: stored ? "direct_with_preferences" : "direct", quiz, destinationId, stayId: stayFits ? cleanId(stay.id) : null, useSavedStay: stayFits };
  return { source: stored ? "saved" : "default", quiz, destinationId: null, stayId: null, useSavedStay: true };
}

// The trip on screen: the named destination when there is one (planned even if
// the traveler's filters would rank it out), otherwise the best match.
export function pickTrip({ destinationId, matches = [], catalog = [], plan }) {
  const key = (item) => item?.id || item?.airport;
  if (destinationId) {
    const ranked = matches.find((item) => key(item) === destinationId);
    if (ranked) return ranked;
    const named = catalog.find((item) => key(item) === destinationId);
    return named ? plan(named) : null;
  }
  return matches[0] || null;
}
