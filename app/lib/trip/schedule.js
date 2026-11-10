// The one place trip dates become nights. Every page, estimate, link and email
// reads its nights and date label from tripSchedule() so they always agree.
//
// Rules:
// - Fixed dates (not flexible, valid start and end, end after start): nights is
//   the number of nights between them, e.g. Jan 12 → Jan 17 is 5 nights.
// - Flexible dates: dates are ignored; nights comes from the requested nights,
//   then the quiz's trip length answer, then 7.
// - Nights is always 1–28.

export const DURATION_NIGHTS = Object.freeze({
  "Long Weekend": 3,
  "Five Nights": 5,
  "One Week": 7,
  "Ten Days": 10,
  "Two Weeks": 14,
  "Open-Ended": 7,
});

// Nights a traveler may pick on the calendar for each trip length answer.
const DURATION_RANGE = Object.freeze({
  "Long Weekend": [3, 4],
  "Five Nights": [5, 5],
  "One Week": [7, 7],
  "Ten Days": [10, 10],
  "Two Weeks": [14, 14],
});

const MAX_NIGHTS = 28;

// The allowed nights for a trip length answer, widened to include `keep`
// (nights already on a saved trip) so an older trip never becomes invalid.
export function nightsRange(duration, keep = null) {
  const [min, max] = DURATION_RANGE[duration] || [1, MAX_NIGHTS];
  const held = Number.isInteger(keep) && keep > 0 ? Math.min(MAX_NIGHTS, keep) : null;
  return held ? { min: Math.min(min, held), max: Math.max(max, held) } : { min, max };
}
const DAY = 86400000;

function isoDay(value) {
  const text = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const time = Date.parse(`${text}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === text ? time : null;
}

export function nightsBetween(start, end) {
  const startTime = isoDay(start);
  const endTime = isoDay(end);
  if (startTime === null || endTime === null || endTime <= startTime) return null;
  return Math.round((endTime - startTime) / DAY);
}

export function addNights(start, nights) {
  const time = isoDay(start);
  return time === null ? null : new Date(time + nights * DAY).toISOString().slice(0, 10);
}

function shortDate(value) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function nightsLabel(nights) {
  return `${nights} night${nights === 1 ? "" : "s"}`;
}

export function tripSchedule(input = {}) {
  const flexible = Boolean(input.isFlexible);
  const dated = flexible ? null : nightsBetween(input.tripStart, input.tripEnd);
  if (dated) {
    const nights = Math.min(MAX_NIGHTS, dated);
    // Longer than the maximum: keep the start and cap the stay so dates and nights agree.
    const end = dated > MAX_NIGHTS ? addNights(input.tripStart, MAX_NIGHTS) : input.tripEnd;
    return { start: input.tripStart, end, flexible: false, nights, datesLabel: `${shortDate(input.tripStart)} — ${shortDate(end)}`, label: nightsLabel(nights) };
  }
  const requested = Number.parseInt(input.tripNights, 10);
  const nights = Math.min(MAX_NIGHTS, Math.max(1, (Number.isFinite(requested) && requested > 0 ? requested : null) || DURATION_NIGHTS[input.answers?.duration] || 7));
  return { start: null, end: null, flexible: true, nights, datesLabel: "Flexible dates", label: nightsLabel(nights) };
}
