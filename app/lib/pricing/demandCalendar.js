// Holidays and events that move hotel demand, with the places they move it.
//
// Each entry says where it applies (countries, or specific destinations) and
// when. It carries no surcharge: how much a hotel's price rises is read from
// that hotel's own observations for those nights, never from a fixed
// percentage. Without such observations a stay only gets a demand note.
//
// Dates are computed (Easter, Thanksgiving, Oktoberfest) or listed per year
// where they follow another calendar (Lunar New Year, Diwali). Years outside
// a list return nothing rather than a guess.

const DAY = 86400000;
const iso = (time) => new Date(time).toISOString().slice(0, 10);
const date = (year, month, day) => Date.UTC(year, month - 1, day);

// Anonymous Gregorian algorithm.
export function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return date(year, month, day);
}

function nthWeekday(year, month, weekday, n) {
  const first = new Date(date(year, month, 1)).getUTCDay();
  return date(year, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
}

const LUNAR_NEW_YEAR = { 2025: [1, 29], 2026: [2, 17], 2027: [2, 6], 2028: [1, 26], 2029: [2, 13], 2030: [2, 3] };
const DIWALI = { 2025: [10, 20], 2026: [11, 8], 2027: [10, 29], 2028: [10, 17], 2029: [11, 5], 2030: [10, 26] };

const CHRISTIAN_EASTER = ["UNITED STATES", "UNITED KINGDOM", "IRELAND", "FRANCE", "GERMANY", "SPAIN", "PORTUGAL", "ITALY", "AUSTRIA", "SWITZERLAND", "BELGIUM", "NETHERLANDS", "LUXEMBOURG", "POLAND", "CZECH REPUBLIC", "SLOVAKIA", "SLOVENIA", "CROATIA", "HUNGARY", "DENMARK", "NORWAY", "SWEDEN", "FINLAND", "ICELAND", "MALTA", "MEXICO", "GUATEMALA", "BELIZE", "HONDURAS", "COSTA RICA", "PANAMA", "COLOMBIA", "ECUADOR", "PERU", "BOLIVIA", "CHILE", "ARGENTINA", "ARGENTINA & CHILE", "URUGUAY", "BRAZIL", "PHILIPPINES", "PUERTO RICO", "DOMINICAN REPUBLIC", "AUSTRALIA", "NEW ZEALAND", "CANADA"];
const CHRISTMAS = [...CHRISTIAN_EASTER, "BAHAMAS", "BARBADOS", "JAMAICA", "CURAÇAO", "CUBA", "SOUTH AFRICA", "NAMIBIA", "BOTSWANA", "ZIMBABWE", "KENYA", "TANZANIA", "MAURITIUS", "SEYCHELLES", "MALDIVES", "FRENCH POLYNESIA", "ESTONIA", "LATVIA", "ROMANIA", "BULGARIA", "MONTENEGRO", "SERBIA", "ALBANIA", "GREECE", "MONACO"];
const LATIN_HOLY_WEEK = ["MEXICO", "GUATEMALA", "BELIZE", "HONDURAS", "COSTA RICA", "PANAMA", "COLOMBIA", "ECUADOR", "PERU", "BOLIVIA", "CHILE", "ARGENTINA", "ARGENTINA & CHILE", "URUGUAY", "SPAIN", "PHILIPPINES"];
const LUNAR = ["CHINA", "TAIWAN", "SINGAPORE", "MALAYSIA", "VIETNAM", "SOUTH KOREA", "INDONESIA", "THAILAND"];

// Each rule returns [start, end] (inclusive day timestamps) for a year, or null.
const EVENTS = [
  { id: "christmas", name: "Christmas", countries: CHRISTMAS, dates: (y) => [date(y, 12, 22), date(y, 12, 27)] },
  { id: "new-year", name: "New Year's Eve", countries: "*", dates: (y) => [date(y, 12, 29), date(y + 1, 1, 2)] },
  { id: "easter", name: "Easter", countries: CHRISTIAN_EASTER, dates: (y) => [easter(y) - 3 * DAY, easter(y) + DAY] },
  { id: "holy-week", name: "Semana Santa", countries: LATIN_HOLY_WEEK, dates: (y) => [easter(y) - 7 * DAY, easter(y)] },
  { id: "thanksgiving", name: "US Thanksgiving", countries: ["UNITED STATES"], dates: (y) => { const day = nthWeekday(y, 11, 4, 4); return [day - DAY, day + 3 * DAY]; } },
  { id: "july-4", name: "Independence Day", countries: ["UNITED STATES"], dates: (y) => [date(y, 7, 3), date(y, 7, 5)] },
  { id: "lunar-new-year", name: "Lunar New Year", countries: LUNAR, dates: (y) => { const d = LUNAR_NEW_YEAR[y]; return d ? [date(y, ...d) - 2 * DAY, date(y, ...d) + 6 * DAY] : null; } },
  { id: "golden-week-jp", name: "Golden Week", countries: ["JAPAN"], dates: (y) => [date(y, 4, 29), date(y, 5, 6)] },
  { id: "obon", name: "Obon", countries: ["JAPAN"], dates: (y) => [date(y, 8, 11), date(y, 8, 17)] },
  { id: "golden-week-cn", name: "National Day Golden Week", countries: ["CHINA"], dates: (y) => [date(y, 10, 1), date(y, 10, 7)] },
  { id: "songkran", name: "Songkran", countries: ["THAILAND", "LAOS", "CAMBODIA"], dates: (y) => [date(y, 4, 12), date(y, 4, 16)] },
  { id: "diwali", name: "Diwali", countries: ["INDIA", "NEPAL"], dates: (y) => { const d = DIWALI[y]; return d ? [date(y, ...d) - 2 * DAY, date(y, ...d) + 2 * DAY] : null; } },
  { id: "carnival", name: "Carnival", countries: ["BRAZIL"], dates: (y) => [easter(y) - 51 * DAY, easter(y) - 46 * DAY] },
  { id: "carnival-caribbean", name: "Carnival", destinations: ["POS", "CUR", "BGI"], dates: (y) => [easter(y) - 49 * DAY, easter(y) - 46 * DAY] },
  { id: "oktoberfest", name: "Oktoberfest", destinations: ["MUC"], dates: (y) => { let end = nthWeekday(y, 10, 0, 1); if (end < date(y, 10, 3)) end = date(y, 10, 3); return [end - 15 * DAY, end]; } },
  { id: "day-of-the-dead", name: "Día de Muertos", destinations: ["OAX", "MEX"], dates: (y) => [date(y, 10, 30), date(y, 11, 2)] },
  { id: "hogmanay", name: "Hogmanay", destinations: ["EDI"], dates: (y) => [date(y, 12, 29), date(y + 1, 1, 2)] },
  { id: "edinburgh-festivals", name: "Edinburgh festivals", destinations: ["EDI"], dates: (y) => [nthWeekday(y, 8, 5, 1), nthWeekday(y, 8, 1, 4)] },
  { id: "kings-day", name: "King's Day", destinations: ["AMS"], dates: (y) => [date(y, 4, 26), date(y, 4, 27)] },
  { id: "las-fallas", name: "Las Fallas", destinations: ["VLC"], dates: (y) => [date(y, 3, 15), date(y, 3, 19)] },
  { id: "san-fermin", name: "San Fermín", destinations: ["PNA"], dates: (y) => [date(y, 7, 6), date(y, 7, 14)] },
  { id: "mardi-gras", name: "Mardi Gras", destinations: ["MSY"], dates: (y) => [easter(y) - 51 * DAY, easter(y) - 47 * DAY] },
];

function matches(event, destination) {
  if (event.destinations) return event.destinations.includes(destination?.id) || event.destinations.includes(destination?.airport);
  if (event.countries === "*") return true;
  return event.countries.includes(String(destination?.country || "").toUpperCase());
}

// Events touching any night from checkIn up to (not including) checkOut, with
// the nights each covers.
export function demandEvents(destination, checkIn, checkOut) {
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  const years = [...new Set([new Date(start).getUTCFullYear() - 1, new Date(start).getUTCFullYear(), new Date(end).getUTCFullYear()])];
  const found = [];
  for (const event of EVENTS) {
    if (!matches(event, destination)) continue;
    for (const year of years) {
      const range = event.dates(year);
      if (!range) continue;
      const nights = [];
      for (let time = Math.max(start, range[0]); time < end && time <= range[1]; time += DAY) nights.push(iso(time));
      if (nights.length) found.push({ id: event.id, name: event.name, from: iso(range[0]), to: iso(range[1]), nights });
    }
  }
  return found;
}

export const DEMAND_EVENT_IDS = EVENTS.map((event) => event.id);
