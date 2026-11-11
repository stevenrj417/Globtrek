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
