import { normalizeManifestLinks } from "../booking/cj.js";
import { bookingPageUrl } from "../booking/bookPage.js";
import { estimateLine } from "../format.js";

// Email palette and type, matched to the site. Email clients ignore most CSS,
// so everything is inline and laid out with tables.
const INK = "#171714";
const MUTED = "#5f5b54";
const SUBTLE = "#8b867d";
const LINE = "#e3dfd8";
const PAPER = "#f6f4ef";
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const SITE = "https://www.glob-trek.com";
const AFFILIATE_NOTE = "GlobTrek may earn a commission from qualifying bookings. Compare the provider's final price, fees and terms before booking.";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}

// Absolute https image URL, or nothing. Site-relative paths become glob-trek.com URLs.
function imageSource(url) {
  if (!url) return "";
  try {
    const source = new URL(url, SITE);
    if (source.protocol !== "https:") return "";
    if (source.hostname === "images.unsplash.com" && !source.searchParams.has("w")) { source.searchParams.set("w", "1200"); source.searchParams.set("q", "80"); source.searchParams.set("auto", "format"); }
    return source.toString();
  } catch { return ""; }
}

function eyebrowHtml(text, color = SUBTLE) {
  return text ? `<p style="margin:0;font-family:${SANS};font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${color}">${escapeHtml(text)}</p>` : "";
}

// Postal address for commercial email (US CAN-SPAM). Set MAILING_ADDRESS in Vercel.
export function mailingAddress() {
  return String(process.env.MAILING_ADDRESS || "").trim();
}

function footerHtml({ reason, unsubscribeUrl, unsubscribeLabel = "Unsubscribe", commercial = true }) {
  const address = mailingAddress();
  return `<tr><td style="padding:32px 40px 40px;border-top:1px solid ${LINE};font-family:${SANS};font-size:12px;line-height:1.7;color:${SUBTLE}">
    <p style="margin:0 0 10px">${reason}${unsubscribeUrl ? ` <a href="${escapeHtml(unsubscribeUrl)}" style="color:${INK};text-decoration:underline">${escapeHtml(unsubscribeLabel)}</a>.` : ""}</p>
    ${commercial ? `<p style="margin:0 0 10px">${escapeHtml(AFFILIATE_NOTE)}</p>` : ""}
    <p style="margin:0">GlobTrek${address ? ` · ${escapeHtml(address)}` : ""} · <a href="${SITE}" style="color:${SUBTLE}">glob-trek.com</a></p>
  </td></tr>`;
}

function shell({ preheader, eyebrow, title, intro = "", hero = "", heroAlt = "", body, footer }) {
  const heroUrl = imageSource(hero);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};color:${INK};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}"><tr><td align="center" style="padding:28px 12px 48px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff">
  <tr><td style="padding:26px 40px;border-bottom:1px solid ${LINE}"><a href="${SITE}" style="font-family:${SANS};font-size:22px;font-weight:700;letter-spacing:-.06em;color:${INK};text-decoration:none">GlobTrek</a></td></tr>
  ${heroUrl ? `<tr><td><img src="${escapeHtml(heroUrl)}" alt="${escapeHtml(heroAlt)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>` : ""}
  <tr><td style="padding:40px 40px 8px">
    ${eyebrowHtml(eyebrow)}
    <h1 style="margin:14px 0 0;font-family:${SERIF};font-size:40px;line-height:1.05;font-weight:400;letter-spacing:-.02em;color:${INK}">${escapeHtml(title)}</h1>
    ${intro ? `<p style="margin:18px 0 0;font-family:${SANS};font-size:16px;line-height:1.65;color:${MUTED}">${intro}</p>` : ""}
  </td></tr>
  <tr><td style="padding:8px 40px 40px;font-family:${SANS};font-size:15px;line-height:1.65;color:${MUTED}">${body}</td></tr>
  ${footer}
</table>
</td></tr></table>
</body></html>`;
}

function button(label, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px"><tr><td style="background:${INK}"><a href="${escapeHtml(href)}" style="display:inline-block;padding:16px 26px;font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#ffffff;text-decoration:none">${escapeHtml(label)} &rarr;</a></td></tr></table>`;
}

function textLink(label, href) {
  return `<a href="${escapeHtml(href)}" style="font-family:${SANS};font-size:13px;font-weight:600;color:${INK};text-decoration:underline">${escapeHtml(label)}</a>`;
}

function trackedUrl(path, campaign) {
  const url = new URL(path, SITE);
  url.searchParams.set("utm_source", "email");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

// One trip card: photo, name, a short line and the estimate as the site shows it.
function tripCard(trip, campaign) {
  const href = trackedUrl(`/discover/quick?destination=${encodeURIComponent(trip.id)}&destinationName=${encodeURIComponent(trip.name)}&source=email`, campaign);
  const image = imageSource(trip.image);
  const estimate = trip.estimate ? estimateLine(trip.estimate) : "";
  return `<tr><td style="padding:0 0 30px">
    <a href="${escapeHtml(href)}" style="text-decoration:none;color:${INK}">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(trip.alt || trip.name)}" width="520" style="display:block;width:100%;height:auto;border:0">` : ""}
      <p style="margin:16px 0 0;font-family:${SANS};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${SUBTLE}">${escapeHtml([trip.country, trip.vibe].filter(Boolean).join(" · "))}</p>
      <p style="margin:6px 0 0;font-family:${SERIF};font-size:28px;line-height:1.1;color:${INK}">${escapeHtml(trip.name)}</p>
      ${estimate ? `<p style="margin:8px 0 0;font-family:${SANS};font-size:13px;color:${MUTED}">${escapeHtml(estimate)}</p>` : ""}
    </a>
  </td></tr>`;
}

function tripCards(trips, campaign) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px">${trips.map((trip) => tripCard(trip, campaign)).join("")}</table>`;
}

const SETTINGS = [["Coast", "Ocean", "/quiz/v2/ocean.jpg"], ["Mountains", "Mountains", "/quiz/v2/mountains.jpg"], ["City", "Cities", "/quiz/v2/cities.jpg"]];

function settingRow(campaign) {
  const cells = SETTINGS.map(([label, setting, image]) => `<td width="33%" style="padding:0 4px;vertical-align:top"><a href="${escapeHtml(trackedUrl(`/discover?setting=${encodeURIComponent(setting)}`, campaign))}" style="text-decoration:none;color:${INK}"><img src="${escapeHtml(imageSource(image))}" alt="" width="168" style="display:block;width:100%;height:auto;border:0"><p style="margin:8px 0 0;font-family:${SANS};font-size:13px;font-weight:600">${label} &rarr;</p></a></td>`).join("");
  return `<p style="margin:12px 0 14px;font-family:${SERIF};font-size:22px;color:${INK}">Or start with a setting</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -4px"><tr>${cells}</tr></table>`;
}

export function welcomeEmail({ unsubscribeUrl, trips = [] }) {
  const steps = [["Answer seven quick questions", "Setting, pace, budget and when you can go."], ["Get one trip that fits", "A place, a stay and things to do, priced as an estimate before you book."], ["Book with the partner", "Continue to Booking.com and other partners for live prices."]];
  const stepRows = steps.map(([title, copy], index) => `<tr><td width="34" style="padding:14px 0;vertical-align:top;border-top:1px solid ${LINE};font-family:${SERIF};font-size:20px;color:${SUBTLE}">${index + 1}</td><td style="padding:14px 0;border-top:1px solid ${LINE}"><p style="margin:0;font-family:${SANS};font-size:15px;font-weight:600;color:${INK}">${title}</p><p style="margin:2px 0 0;font-family:${SANS};font-size:14px;color:${MUTED}">${copy}</p></td></tr>`).join("");
  const body = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">${stepRows}</table>
    ${button("Find my trip", trackedUrl("/discover", "welcome"))}
    ${trips.length ? `<p style="margin:44px 0 0;font-family:${SERIF};font-size:26px;color:${INK}">Going well this season</p>${tripCards(trips, "welcome")}` : ""}
    ${settingRow("welcome")}`;
  return shell({ preheader: "One affordable trip, picked for how you like to travel.", eyebrow: "Welcome to GlobTrek", title: "Where to next?", intro: "Thanks for signing up. Once a month we'll send a few trips that fit a small budget. Here's how GlobTrek works.", hero: "/quiz/v2/one-week.jpg", heroAlt: "Blue domes above the caldera in Oia, Santorini", body, footer: footerHtml({ reason: `You're getting this because you signed up at glob-trek.com.`, unsubscribeUrl }) });
}

function monthName(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(date);
}

export function monthlyEmail({ unsubscribeUrl, trips = [], date = new Date() }) {
  const month = monthName(date);
  const lead = trips[0];
  const body = `${tripCards(trips, `monthly-${month.toLowerCase()}`)}
    <p style="margin:0;font-size:13px;color:${SUBTLE}">Estimates are for one traveler before flights, from GlobTrek's planning averages. Live prices are on the partner's site.</p>
    ${button("Find my trip", trackedUrl("/discover", `monthly-${month.toLowerCase()}`))}
    <div style="margin-top:40px">${settingRow(`monthly-${month.toLowerCase()}`)}</div>`;
  return shell({ preheader: `${trips.map((trip) => trip.name).join(", ")}: trips that fit a small budget this ${month}.`, eyebrow: `${month} trips`, title: `Places worth going in ${month}.`, intro: "A few trips that are going well right now, each with a rough cost so you can see what fits.", hero: lead?.image, heroAlt: lead?.alt || "", body: body, footer: footerHtml({ reason: "You're getting this monthly email because you signed up for GlobTrek trip ideas.", unsubscribeUrl }) });
}

function money(value) { return Number.isFinite(Number(value)) ? `$${Math.round(Number(value)).toLocaleString("en-US")}` : "Unknown"; }

function emailImage(url, alt) {
  try {
    const source = new URL(url);
    if (source.protocol !== "https:") return "";
    return `<img src="${escapeHtml(source.toString())}" alt="${escapeHtml(alt)}" width="520" style="display:block;width:100%;height:auto;object-fit:cover;border:0">`;
  } catch { return ""; }
}

function detailButton(label, href) {
  if (!href) return `<span style="font-size:11px;color:#6d685f">Link being verified</span>`;
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#171714;color:#fff;padding:12px 16px;text-decoration:none;font-size:11px;letter-spacing:.14em;text-transform:uppercase">${escapeHtml(label)} →</a>`;
}

function selectionCard({ eyebrow, name, imageUrl, details = [], actionLabel, url }) {
  return `<section style="border-top:1px solid #e3dfd8;padding:28px 0">${emailImage(imageUrl, name)}<p style="margin:18px 0 0;font-size:11px;letter-spacing:.2em;text-transform:uppercase">${escapeHtml(eyebrow)}</p><h2 style="font-family:Georgia,serif;font-size:28px;line-height:1.08;font-weight:400;margin:9px 0 12px">${escapeHtml(name)}</h2><p style="font-size:14px;line-height:1.7;margin:0 0 18px;color:#5f5b54">${details.filter(Boolean).map(escapeHtml).join("<br>")}</p>${detailButton(actionLabel, url)}</section>`;
}

export function bookingChecklistUrl(model) {
  const manifest = normalizeManifestLinks(model.bookingManifest || {});
  return bookingPageUrl({ ...manifest, destination: manifest.destination || model.destination, dates: manifest.dates || model.dates, travelers: manifest.travelers || (typeof model.travelers === "object" ? model.travelers : { total: model.travelers }) }, SITE);
}

// `followup` is { confirmUrl } when the reader still has to opt in to the
// check-ins, or { stopUrl } once they're on.
function followupNote(followup) {
  if (followup?.confirmUrl) return `<div style="margin-top:36px;padding:24px;background:${PAPER};border:1px solid ${LINE}"><p style="margin:0;font-family:${SERIF};font-size:22px;color:${INK}">Want a few reminders about this trip?</p><p style="margin:8px 0 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${MUTED}">Six short emails over the next month: things to do, where you'd stay and a nudge to check prices. Nothing is sent unless you say yes.</p><p style="margin:16px 0 0">${textLink("Yes, send me reminders", followup.confirmUrl)}</p></div>`;
  if (followup?.stopUrl) return `<p style="margin:32px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTED}">We'll check in about this trip a few times over the next month. ${textLink("Stop emails about this trip", followup.stopUrl)}</p>`;
  return "";
}

export function tripEmail({ model, viewUrl, arrival = false, followup = null }) {
  const days = model.itinerary?.days || [];
  const journey = model.journey;
  const sequenceLabel = journey?.type === "cruise" ? "Port" : "Day";
  const dayHtml = days.map((day, index) => `<section style="border-top:1px solid #d8d4ce;padding:22px 0"><p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#777">${sequenceLabel} ${String(index + 1).padStart(2, "0")} · ${escapeHtml(day.location || "")}</p><h2 style="font-family:Georgia,serif;font-size:25px;font-weight:400;margin:8px 0 14px">${escapeHtml(day.title)}</h2><p style="font-size:14px;line-height:1.7;color:#5f5b54"><b>Morning</b> ${escapeHtml(day.morning)}<br><b>Afternoon</b> ${escapeHtml(day.afternoon)}<br><b>Evening</b> ${escapeHtml(day.evening)}</p></section>`).join("");
  const costs = model.estimatedCostBreakdown;
  const manifest = normalizeManifestLinks(model.bookingManifest || {});
  const bookAllUrl = bookingChecklistUrl(model);
  const bookAll = bookAllUrl ? `<div style="margin:28px 0 8px;padding:22px;border:1px solid #171714;background:#fbfaf7"><p style="margin:0;font-size:13px;line-height:1.7">Your booking checklist: your stay, flight and bookable plans in one list. Open each one on the partner&#039;s site, with your dates and travelers filled in where the partner&#039;s link supports it, and check it off when it&#039;s booked.</p>${button("Open booking checklist", bookAllUrl)}<p style="margin:14px 0 0;font-size:11px;line-height:1.6;color:#6b6b6b">GlobTrek&#039;s prices are estimates; check the current price and availability on each partner&#039;s site. You pay each partner directly.</p></div>` : "";
  const travelerTotal = typeof model.travelers === "object" ? model.travelers.total : model.travelers;
  const logistics = `<p style="font-size:12px;line-height:1.8">${model.dates?.start ? `${escapeHtml(model.dates.start)} – ${escapeHtml(model.dates.end || "")}` : "Flexible dates"}${travelerTotal ? ` · ${escapeHtml(travelerTotal)} travelers` : ""}${model.exactBudget ? ` · ${money(model.exactBudget)} budget` : ""}</p>`;
  const hotelBooking = manifest.hotelBookings?.[0];
  const hotelHtml = model.hotel ? selectionCard({ eyebrow: "Your stay", name: model.hotel.name, imageUrl: hotelBooking?.photoUrl || hotelBooking?.imageUrl || model.hotel.image, details: [model.hotel.neighborhood || model.hotel.address, model.hotel.rating != null ? `${model.hotel.rating} rating${model.hotel.reviewCount != null ? ` · ${Number(model.hotel.reviewCount).toLocaleString("en-US")} reviews` : ""}` : null, model.dates?.start ? `${model.dates.start} – ${model.dates.end || ""}` : null, model.hotel.priceEstimate || null], actionLabel: "Book hotel", url: hotelBooking?.exactUrl || model.bookingLinks?.hotel }) : "";
  const flight = manifest.flightBooking || (model.flight?.selected ? model.flight : null);
  const flightHtml = flight ? selectionCard({ eyebrow: "Your flight", name: `${flight.origin} → ${flight.destination}`, details: [flight.departureDate && flight.returnDate ? `${flight.departureDate} – ${flight.returnDate}` : "Flexible dates", `${flight.adults || 1} adults${flight.children ? ` · ${flight.children} children` : ""}`, flight.cabin || "ECONOMY", flight.preferredDeparture || flight.timing ? `${flight.preferredDeparture || flight.timing} departure preferred` : null, flight.selectedItinerary?.summary || null], actionLabel: "Book flight", url: flight.deepLink || model.bookingLinks?.flight }) : "";
  const restaurantLinks = new Map((manifest.restaurantBookings || model.bookingLinks?.restaurants || []).map((item) => [item.name, item.exactUrl || item.url]));
  const restaurantManifest = new Map((manifest.restaurantBookings || []).map((item) => [item.name, item]));
  const diningHtml = (model.restaurants || []).length ? `<div style="margin-top:38px"><p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase">Dining</p>${model.restaurants.map((item) => { const booking = restaurantManifest.get(item.name); return selectionCard({ eyebrow: item.reservationTime || item.time || "Selected restaurant", name: item.name, imageUrl: booking?.imageUrl || item.imageUrl, details: [item.neighborhood || item.location, item.reservationTime || item.time || null], ...(booking?.reservation ? { actionLabel: `Reserve ${item.name}`, url: restaurantLinks.get(item.name) } : { actionLabel: `About ${item.name}`, url: restaurantLinks.get(item.name) }) }); }).join("")}</div>` : "";
  const activityLinks = new Map((manifest.experienceBookings || model.bookingLinks?.activities || []).map((item) => [item.name, item.exactUrl || item.url]));
  const activityManifest = new Map((manifest.experienceBookings || []).map((item) => [item.name, item]));
  const experienceHtml = (model.activities || []).length ? `<div style="margin-top:38px"><p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase">Experiences</p>${model.activities.map((item) => { const booking = activityManifest.get(item.name); return selectionCard({ eyebrow: item.category || "Selected experience", name: item.name, imageUrl: booking?.imageUrl || item.imageUrl, details: [item.description, item.location, item.scheduledAt || item.dateTime], actionLabel: `Book ${item.name}`, url: activityLinks.get(item.name) }); }).join("")}</div>` : "";
  const estimates = costs?.estimates || {};
  const costLabels = { flights: "Flights", hotel: "Stay", food: "Dining", activities: "Experiences", transportation: "Transportation", miscBuffer: "Buffer" };
  const costRows = Object.entries(estimates).map(([key, value]) => `<tr><td style="padding:8px 0;border-top:1px solid #171714;font-size:12px">${escapeHtml(costLabels[key] || key)}</td><td style="padding:8px 0;border-top:1px solid #171714;font-family:Georgia,serif;font-size:15px;text-align:right">${money(value.low)}–${money(value.high)}</td></tr>`).join("");
  const costHtml = costs ? `<div style="margin-top:42px"><p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase">Trip cost</p><h2 style="font-family:Georgia,serif;font-size:32px;font-weight:400;margin:10px 0">${money(costs.estimatedTripLow)}–${money(costs.estimatedTripHigh)} estimated</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${costRows}</table><p style="font-size:11px;line-height:1.6">Planning estimates only. Confirm final prices and availability with each provider.</p></div>` : "";
  const ports = Array.isArray(journey?.ports) ? journey.ports.map((port) => `${escapeHtml(port.name)}${port.country ? `, ${escapeHtml(port.country)}` : ""}`).join(" → ") : "";
  const journeyHtml = journey?.type === "cruise" ? `<div style="margin-top:38px;border-top:1px solid #d8d4ce;padding-top:22px"><p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#777">Ocean journey</p><h2 style="font-family:Georgia,serif;font-size:27px;font-weight:400;margin:10px 0 14px">${escapeHtml(journey.title)}</h2>${ports ? `<p style="font-size:12px;line-height:1.8;color:#555">${ports}</p>` : ""}<p style="font-size:12px;line-height:1.8;color:#555">Ship: ${journey.ship?.name ? escapeHtml(journey.ship.name) : "Pending verified sailing inventory"}<br>Flights: ${escapeHtml(journey.flight?.origin || "Origin pending")} → ${escapeHtml(journey.flight?.destination || "port")}${journey.flight?.departureDate ? ` · ${escapeHtml(journey.flight.departureDate)}` : " · dates flexible"}<br>${escapeHtml(journey.flight?.providerStatus || "Live itinerary not connected")}<br>Cruise: ${escapeHtml(journey.cruiseProviderStatus || "Provider link pending")}</p></div>` : "";
  const title = journey?.type === "cruise" ? journey.title : `${days.length} days in ${model.destination?.city || model.destination?.name || "your destination"}`;
  const preheader = journey?.type === "cruise" ? `Your ${journey.duration || "ocean"} GlobTrek journey.` : `Your complete ${days.length}-day GlobTrek itinerary.`;
  return shell({ preheader, eyebrow: arrival ? "Here's your trip" : "One tab travel", title, hero: model.destinationImage, heroAlt: model.destination?.city || model.destination?.name || "Destination", body: `${logistics}${bookAll}${hotelHtml}${flightHtml}<div style="margin-top:42px"><p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase">Your itinerary</p>${dayHtml}</div>${diningHtml}${experienceHtml}${costHtml}${journeyHtml}${bookAllUrl ? button("Open booking checklist", bookAllUrl) : ""}${viewUrl ? button("View trip", viewUrl) : ""}${followupNote(followup)}`, footer: footerHtml({ reason: arrival ? "You finished the GlobTrek quiz while signed in, so we sent your trip to your account email." : "You asked GlobTrek to email you this trip. It does not subscribe you to marketing email. Confirm final prices and availability with each provider." }) });
}

function cityOf(model) {
  return model.destination?.city || model.destination?.name || "your destination";
}

function listRows(items) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px">${items.map(([title, copy], index) => `<tr><td width="34" style="padding:14px 0;vertical-align:top;border-top:1px solid ${LINE};font-family:${SERIF};font-size:20px;color:${SUBTLE}">${index + 1}</td><td style="padding:14px 0;border-top:1px solid ${LINE}"><p style="margin:0;font-family:${SANS};font-size:15px;font-weight:600;color:${INK}">${escapeHtml(title)}</p>${copy ? `<p style="margin:2px 0 0;font-family:${SANS};font-size:14px;color:${MUTED}">${escapeHtml(copy)}</p>` : ""}</td></tr>`).join("")}</table>`;
}

function stayBlock(model) {
  const hotel = model.hotel;
  if (!hotel?.name) return "";
  const booking = normalizeManifestLinks(model.bookingManifest || {}).hotelBookings?.[0];
  const image = imageSource(booking?.photoUrl || booking?.imageUrl || hotel.image);
  const rating = hotel.rating != null ? `${hotel.rating} rating${hotel.reviewCount != null ? ` from ${Number(hotel.reviewCount).toLocaleString("en-US")} reviews` : ""}` : "";
  return `<div style="margin-top:26px;border-top:1px solid ${LINE};padding-top:24px">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(hotel.name)}" width="520" style="display:block;width:100%;height:auto;border:0;margin-bottom:16px">` : ""}${eyebrowHtml("Your stay")}<p style="margin:6px 0 0;font-family:${SERIF};font-size:26px;line-height:1.1;color:${INK}">${escapeHtml(hotel.name)}</p><p style="margin:8px 0 0;font-size:14px;color:${MUTED}">${escapeHtml([hotel.neighborhood || hotel.address, rating].filter(Boolean).join(" · "))}</p></div>`;
}

export const FOLLOWUP_DAYS = [1, 3, 5, 10, 20, 30];

// The emails sent after someone emails or books a trip. `step` is 1-based:
// step 1 goes out a day later, step 6 a month later and is the last one.
export function followupEmail({ model, step, viewUrl, stopUrl }) {
  const city = cityOf(model);
  const bookUrl = bookingChecklistUrl(model);
  const tripUrl = viewUrl || bookUrl || `${SITE}/discover`;
  const days = model.itinerary?.days || [];
  const activities = (model.activities || []).slice(0, 3).map((item) => [item.name, item.description || item.location || ""]);
  const thingsLabel = ["Things", "One thing", "Two things", "Three things"][activities.length] || "Things";
  const dayHighlights = days.slice(0, 3).map((day) => [day.title, day.location || ""]);
  const links = `${button(bookUrl ? "Open booking checklist" : "Open your trip", bookUrl || tripUrl)}${bookUrl && viewUrl ? `<p style="margin:16px 0 0">${textLink("See the whole trip", viewUrl)}</p>` : ""}`;
  const content = {
    1: { subject: `Still thinking about ${city}?`, eyebrow: "Your trip", title: `Still thinking about ${city}?`, intro: "Here's the trip you sent yourself yesterday, all in one place.", body: `${stayBlock(model)}${links}` },
    2: { subject: `${thingsLabel} to do in ${city}`, eyebrow: "Plans", title: `${thingsLabel} to do in ${city}`, intro: activities.length ? "Picked for your trip, so you can book the ones that sell out." : "A few highlights from your plan.", body: `${listRows(activities.length ? activities : dayHighlights)}${links}` },
    3: { subject: `Where you'd stay in ${city}`, eyebrow: "Your stay", title: `Where you'd stay in ${city}`, intro: model.hotel?.name ? "The stay on your trip, matched to a real listing. Check the live price for your dates on the partner's site." : "Pick a stay on your trip page to see it here, with a link to book.", body: `${stayBlock(model)}${links}` },
    4: { subject: `Prices for ${city} change. Check yours.`, eyebrow: "Before you book", title: "Prices change. Check yours.", intro: "The numbers on your trip are GlobTrek estimates. The live price for your dates is on the partner's site, and it moves as rooms and seats fill.", body: `${links}` },
    5: { subject: `Your ${days.length || ""} days in ${city}, at a glance`.replace("  ", " "), eyebrow: "Your itinerary", title: `${days.length ? `${days.length} days` : "Your days"} in ${city}`, intro: "The whole plan, one line per day.", body: `${listRows(days.map((day) => [day.title, [day.morning, day.afternoon].filter(Boolean).join(" · ")]))}${links}` },
    6: { subject: `Still want to go to ${city}?`, eyebrow: "One last note", title: `Still want to go to ${city}?`, intro: "This is the last email about this trip. If it's not the one, a different answer to the quiz will find another.", body: `${links}<p style="margin:18px 0 0">${textLink("Find a different trip", trackedUrl("/discover", "followup-6"))}</p>` },
  }[step];
  if (!content) return null;
  const html = shell({ preheader: content.intro, eyebrow: content.eyebrow, title: content.title, intro: escapeHtml(content.intro), hero: step === 3 ? "" : model.destinationImage, heroAlt: city, body: content.body, footer: footerHtml({ reason: `You emailed yourself a GlobTrek trip to ${escapeHtml(city)}, so we're checking in a few times this month.`, unsubscribeUrl: stopUrl, unsubscribeLabel: "Stop emails about this trip" }) });
  return { subject: content.subject, html };
}

export { escapeHtml };
