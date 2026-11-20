// The travel period a flexible trip is planned for, so flights, stays and daily
// costs are all estimated for the same months.
//
// - Exact dates: the period is the month of the start date.
// - Flexible with a season: the next full occurrence of that season that starts
//   after the current month, e.g. "Winter (Dec-Feb)" asked in November 2026 is
//   December 2026–February 2027.
// - Flexible with no season: no fixed period; estimates use the cheapest month
//   the fare data shows, and say which month that is.

export const SEASON_MONTH_LIST = Object.freeze({
  "Spring (Mar-May)": [3, 4, 5],
  "Summer (Jun-Aug)": [6, 7, 8],
  "Fall (Sep-Nov)": [9, 10, 11],
  "Winter (Dec-Feb)": [12, 1, 2],
});

const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function monthName(month) {
  return MONTH[month - 1] || "";
}

export function yearMonth(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// now: a Date (defaults to the current time); only its UTC year and month are used.
export function travelPeriod({ start = null, flexible = true, season = null } = {}, now = new Date()) {
  if (start && !flexible) {
    const year = Number(start.slice(0, 4));
    const month = Number(start.slice(5, 7));
    return { kind: "dates", months: [yearMonth(year, month)], planningMonth: month, label: `${monthName(month)} ${year}` };
  }
  const months = SEASON_MONTH_LIST[season];
  if (!months) return { kind: "open", months: [], planningMonth: null, label: "Flexible dates" };
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  // The season's first month, in the first year where it is after this month.
  let year = currentYear;
  if (months[0] <= currentMonth) year += 1;
  const list = months.map((month, index) => yearMonth(month < months[0] && index > 0 ? year + 1 : year, month));
  const [firstYear] = list[0].split("-").map(Number);
  const [lastYear, lastMonth] = list[list.length - 1].split("-").map(Number);
  const label = firstYear === lastYear
    ? `${monthName(months[0])}–${monthName(lastMonth)} ${firstYear}`
    : `${monthName(months[0])} ${firstYear}–${monthName(lastMonth)} ${lastYear}`;
  return { kind: "season", months: list, planningMonth: months[0], label };
}

// The calendar month (1–12) costs are estimated for: the start date's month, else
// the month the fare was found for when it falls in the period, else the period's
// first month, else null.
export function pricingMonth(profile, fareMonth = null) {
  if (profile?.dates?.start) return Number(profile.dates.start.slice(5, 7));
  const period = profile?.dates?.period;
  if (fareMonth && (!period?.months?.length || period.months.includes(fareMonth))) return Number(String(fareMonth).slice(5, 7));
  return period?.planningMonth || null;
}

const DAY = 86400000;

function seedNumber(seed) {
  let hash = 2166136261;
  for (const character of String(seed)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  // Final mix so similar seeds land far apart.
  hash = Math.imul(hash ^ (hash >>> 16), 2246822507) >>> 0;
  return Math.imul(hash ^ (hash >>> 13), 3266489909) >>> 0;
}

function isoDate(time) {
  return new Date(time).toISOString().slice(0, 10);
}

// Real dates for a flexible trip, so partner links and the booking assistant have
// something to book. The start is a Friday or Saturday in the month the estimate
// is priced for (inside the chosen season), at least three weeks out, and the same
// every time for the same seed so links don't change between visits.
export function suggestedDates({ period = null, pricedMonth = null, nights = 7, seed = "" } = {}, now = new Date()) {
  const earliest = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + 21 * DAY;
  const firstYear = new Date(earliest).getUTCFullYear();
  const firstMonth = new Date(earliest).getUTCMonth() + 1;
  // The months to try, in order: the priced month first, then the rest of the season,
  // or for an open trip the next twelve months.
  let months = period?.months?.length ? [...period.months] : Array.from({ length: 12 }, (_, index) => {
    const month = ((firstMonth - 1 + index) % 12) + 1;
    return yearMonth(firstYear + Math.floor((firstMonth - 1 + index) / 12), month);
  });
  const priced = months.find((value) => Number(value.slice(5, 7)) === Number(pricedMonth));
  if (priced) months = [priced, ...months.filter((value) => value !== priced)];
  const pick = seedNumber(seed);
  for (const value of months) {
    let [year, month] = value.split("-").map(Number);
    // A season month already past (or too soon) moves to next year.
    if (Date.UTC(year, month, 0) < earliest) year += 1;
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const starts = [];
    for (let day = 1; day <= days; day += 1) {
      const time = Date.UTC(year, month - 1, day);
      const weekday = new Date(time).getUTCDay();
      // No stay over Christmas and New Year (Dec 20–Jan 2), when prices and availability are at their worst.
      const end = time + nights * DAY;
      const holidays = [year - 1, year].some((y) => time <= Date.UTC(y + 1, 0, 2) && end >= Date.UTC(y, 11, 20));
      if (time >= earliest && (weekday === 5 || weekday === 6) && !holidays) starts.push(time);
    }
    if (starts.length) {
      const start = starts[Math.floor((pick / 2 ** 32) * starts.length)];
      return { start: isoDate(start), end: isoDate(start + nights * DAY), suggested: true };
    }
  }
  return { start: isoDate(earliest), end: isoDate(earliest + nights * DAY), suggested: true };
}

// Spreads dinners (evenings) or activities (mornings) evenly over the stay, e.g.
// two dinners in five nights land on the 2nd and 4th evenings. Returns one
// "YYYY-MM-DDTHH:MM" per item.
export function spreadOverStay(count, { start, nights }, time) {
  const base = Date.parse(`${start}T00:00:00Z`);
  if (!count || !Number.isFinite(base) || !nights) return [];
  return Array.from({ length: count }, (_, index) => {
    const offset = Math.min(nights - 1, Math.max(0, Math.floor(((index + 1) * nights) / (count + 1))));
    return `${isoDate(base + offset * DAY)}T${time}`;
  });
}
