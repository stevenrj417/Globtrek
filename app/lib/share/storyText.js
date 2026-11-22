// The words on a share story, worked out from the trip and the traveler's choices.
// Pure, so the studio preview and the image route agree, and so it can be tested.

const DAY = 86400000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const STORY_MILESTONES = [30, 7, 1];

const utc = (iso) => (ISO.test(String(iso || "")) ? Date.parse(`${iso}T00:00:00Z`) : NaN);

// Whole days from today to departure, or null without both dates.
export function daysUntil(departure, today) {
  const a = utc(departure);
  const b = utc(today);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((a - b) / DAY);
}

export function cleanLine(value, max) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

function dateRange(start, end) {
  const a = utc(start);
  if (!Number.isFinite(a)) return null;
  const s = new Date(a);
  const b = utc(end);
  const e = Number.isFinite(b) && b >= a ? new Date(b) : null;
  const day = (d) => d.getUTCDate();
  const month = (d) => MONTHS[d.getUTCMonth()];
  if (!e || e.getTime() === s.getTime()) return `${day(s)} ${month(s)} ${s.getUTCFullYear()}`;
  if (s.getUTCFullYear() !== e.getUTCFullYear()) return `${day(s)} ${month(s)} ${s.getUTCFullYear()} – ${day(e)} ${month(e)} ${e.getUTCFullYear()}`;
  if (s.getUTCMonth() !== e.getUTCMonth()) return `${day(s)} ${month(s)} – ${day(e)} ${month(e)} ${e.getUTCFullYear()}`;
  return `${day(s)}–${day(e)} ${month(s)} ${s.getUTCFullYear()}`;
}

// The headline we suggest for how close the trip is.
export function suggestedHeadline({ days, name, country, placeOnly = false }) {
  const where = placeOnly ? country || name : name;
  if (days == null || days < 0) return `Next stop: ${where}`;
  if (days === 0) return "Today's the day";
  if (days === 1) return `Tomorrow: ${where}`;
  if (days <= 30) return `${days} days until ${where}`;
  return `Next stop: ${where}`;
}

// options: { name, country, departure, returnDate, today, headline, showCountdown,
//   showDate, countryOnly, credit }
export function storyText(options) {
  const name = cleanLine(options.name, 40) || "Somewhere new";
  const country = cleanLine(options.country, 40);
  const countryOnly = Boolean(options.countryOnly && country);
  const days = daysUntil(options.departure, options.today);
  const upcoming = days != null && days >= 0;
  const showCountdown = options.showCountdown !== false && upcoming;
  const headline = cleanLine(options.headline, 48) || suggestedHeadline({ days, name, country, placeOnly: countryOnly });
  const countdown = !showCountdown ? null : days === 0 ? "Departing today" : `${days} day${days === 1 ? "" : "s"} to go`;
  return {
    eyebrow: headline,
    title: countryOnly ? country : name,
    subtitle: countryOnly ? null : country && country !== name ? country : null,
    countdown,
    countNumber: showCountdown ? days : null,
    countUnit: !showCountdown ? null : days === 0 ? "today" : days === 1 ? "day to go" : "days to go",
    date: options.showDate && !countryOnly ? dateRange(options.departure, options.returnDate) : null,
    issue: "The travel issue",
    credit: cleanLine(options.credit, 90) || null,
    days,
  };
}

// Today in the traveler's own time zone, as YYYY-MM-DD.
export function localToday(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
