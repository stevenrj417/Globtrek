function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}

function shell({ preheader, eyebrow, title, body, footer = "Globtrek · One tab travel" }) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width"><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body style="margin:0;background:#f3f0eb;color:#171714;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div><main style="max-width:680px;margin:0 auto;padding:48px 24px 64px"><p style="font-size:12px;font-weight:700;letter-spacing:.28em;text-transform:uppercase">GLOBTRĒK</p><div style="margin-top:54px;border-top:1px solid #cbc7c0;padding-top:28px"><p style="font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:#777">${escapeHtml(eyebrow)}</p><h1 style="margin:18px 0 30px;font-family:Georgia,serif;font-size:48px;line-height:.95;font-weight:400;letter-spacing:-.04em">${escapeHtml(title)}</h1>${body}</div><p style="margin-top:60px;border-top:1px solid #cbc7c0;padding-top:20px;font-size:10px;line-height:1.7;color:#777">${footer}</p></main></body></html>`;
}

function button(label, href) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin-top:24px;background:#171714;color:white;padding:16px 22px;text-decoration:none;font-size:10px;letter-spacing:.18em;text-transform:uppercase">${escapeHtml(label)} →</a>`;
}

export function welcomeEmail({ unsubscribeUrl, siteUrl }) {
  return shell({ preheader: "A quieter way to find your next trip.", eyebrow: "Welcome", title: "Travel ideas, considered.", body: `<p style="font-family:Georgia,serif;font-size:22px;line-height:1.5">A small monthly edit of places worth leaving for—selected with the same restraint Globtrek brings to every trip.</p>${button("Find your trip", siteUrl)}`, footer: `You opted in to Globtrek travel emails. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#171714">Unsubscribe</a>.` });
}

function money(value) { return Number.isFinite(Number(value)) ? `$${Math.round(Number(value)).toLocaleString("en-US")}` : "Unknown"; }

function emailImage(url, alt) {
  try {
    const source = new URL(url);
    if (source.protocol !== "https:") return "";
    return `<img src="${escapeHtml(source.toString())}" alt="${escapeHtml(alt)}" width="632" style="display:block;width:100%;height:auto;max-height:330px;object-fit:cover;border:0">`;
  } catch { return ""; }
}

function detailButton(label, href) {
  if (!href) return `<span style="font-size:11px;color:#6d685f">Link being verified</span>`;
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#171714;color:#fff;padding:12px 16px;text-decoration:none;font-size:9px;letter-spacing:.14em;text-transform:uppercase">${escapeHtml(label)} →</a>`;
}

function selectionCard({ eyebrow, name, imageUrl, details = [], actionLabel, url }) {
  return `<section style="border-top:1px solid #171714;padding:24px 0">${emailImage(imageUrl, name)}<p style="margin:18px 0 0;font-size:9px;letter-spacing:.2em;text-transform:uppercase">${escapeHtml(eyebrow)}</p><h2 style="font-family:Georgia,serif;font-size:28px;line-height:1.08;font-weight:400;margin:9px 0 12px">${escapeHtml(name)}</h2><p style="font-size:12px;line-height:1.7;margin:0 0 18px">${details.filter(Boolean).map(escapeHtml).join("<br>")}</p>${detailButton(actionLabel, url)}</section>`;
}

export function tripEmail({ model, viewUrl }) {
  const days = model.itinerary?.days || [];
  const journey = model.journey;
  const sequenceLabel = journey?.type === "cruise" ? "Port" : "Day";
  const dayHtml = days.map((day, index) => `<section style="border-top:1px solid #d8d4ce;padding:22px 0"><p style="font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#777">${sequenceLabel} ${String(index + 1).padStart(2, "0")} · ${escapeHtml(day.location || "")}</p><h2 style="font-family:Georgia,serif;font-size:25px;font-weight:400;margin:8px 0 14px">${escapeHtml(day.title)}</h2><p style="font-size:13px;line-height:1.7;color:#555"><b>Morning</b> ${escapeHtml(day.morning)}<br><b>Afternoon</b> ${escapeHtml(day.afternoon)}<br><b>Evening</b> ${escapeHtml(day.evening)}</p></section>`).join("");
  const costs = model.estimatedCostBreakdown;
  const manifest = model.bookingManifest || {};
  const travelerTotal = typeof model.travelers === "object" ? model.travelers.total : model.travelers;
  const logistics = `<p style="font-size:12px;line-height:1.8">${model.dates?.start ? `${escapeHtml(model.dates.start)} – ${escapeHtml(model.dates.end || "")}` : "Flexible dates"}${travelerTotal ? ` · ${escapeHtml(travelerTotal)} travelers` : ""}${model.exactBudget ? ` · ${money(model.exactBudget)} budget` : ""}</p>`;
  const hotelBooking = manifest.hotelBookings?.[0];
  const hotelHtml = model.hotel ? selectionCard({ eyebrow: "Your stay", name: model.hotel.name, imageUrl: hotelBooking?.photoUrl || hotelBooking?.imageUrl || model.hotel.image, details: [model.hotel.neighborhood || model.hotel.address, model.hotel.rating != null ? `${model.hotel.rating} rating${model.hotel.reviewCount != null ? ` · ${Number(model.hotel.reviewCount).toLocaleString("en-US")} reviews` : ""}` : null, model.dates?.start ? `${model.dates.start} – ${model.dates.end || ""}` : null, model.hotel.priceEstimate || null], actionLabel: "Book hotel", url: hotelBooking?.exactUrl || model.bookingLinks?.hotel }) : "";
  const flight = manifest.flightBooking || (model.flight?.selected ? model.flight : null);
  const flightHtml = flight ? selectionCard({ eyebrow: "Your flight", name: `${flight.origin} → ${flight.destination}`, details: [flight.departureDate && flight.returnDate ? `${flight.departureDate} – ${flight.returnDate}` : "Flexible dates", `${flight.adults || 1} adults${flight.children ? ` · ${flight.children} children` : ""}`, flight.cabin || "ECONOMY", flight.preferredDeparture || flight.timing ? `${flight.preferredDeparture || flight.timing} departure preferred` : null, flight.selectedItinerary?.summary || null], actionLabel: "Book flight", url: flight.deepLink || model.bookingLinks?.flight }) : "";
  const restaurantLinks = new Map((manifest.restaurantBookings || model.bookingLinks?.restaurants || []).map((item) => [item.name, item.exactUrl || item.url]));
  const restaurantManifest = new Map((manifest.restaurantBookings || []).map((item) => [item.name, item]));
  const diningHtml = (model.restaurants || []).length ? `<div style="margin-top:38px"><p style="font-size:9px;letter-spacing:.2em;text-transform:uppercase">Dining</p>${model.restaurants.map((item) => { const booking = restaurantManifest.get(item.name); return selectionCard({ eyebrow: item.reservationTime || item.time || "Selected restaurant", name: item.name, imageUrl: booking?.imageUrl || item.imageUrl, details: [item.neighborhood || item.location, item.reservationTime || item.time || null], actionLabel: `Reserve ${item.name}`, url: restaurantLinks.get(item.name) }); }).join("")}</div>` : "";
  const activityLinks = new Map((manifest.experienceBookings || model.bookingLinks?.activities || []).map((item) => [item.name, item.exactUrl || item.url]));
  const activityManifest = new Map((manifest.experienceBookings || []).map((item) => [item.name, item]));
  const experienceHtml = (model.activities || []).length ? `<div style="margin-top:38px"><p style="font-size:9px;letter-spacing:.2em;text-transform:uppercase">Experiences</p>${model.activities.map((item) => { const booking = activityManifest.get(item.name); return selectionCard({ eyebrow: item.category || "Selected experience", name: item.name, imageUrl: booking?.imageUrl || item.imageUrl, details: [item.description, item.location, item.scheduledAt || item.dateTime], actionLabel: `Book ${item.name}`, url: activityLinks.get(item.name) }); }).join("")}</div>` : "";
  const estimates = costs?.estimates || {};
  const costLabels = { flights: "Flights", hotel: "Stay", food: "Dining", activities: "Experiences", transportation: "Transportation", miscBuffer: "Buffer" };
  const costRows = Object.entries(estimates).map(([key, value]) => `<tr><td style="padding:8px 0;border-top:1px solid #171714;font-size:12px">${escapeHtml(costLabels[key] || key)}</td><td style="padding:8px 0;border-top:1px solid #171714;font-family:Georgia,serif;font-size:15px;text-align:right">${money(value.low)}–${money(value.high)}</td></tr>`).join("");
  const costHtml = costs ? `<div style="margin-top:42px"><p style="font-size:9px;letter-spacing:.2em;text-transform:uppercase">Trip cost</p><h2 style="font-family:Georgia,serif;font-size:32px;font-weight:400;margin:10px 0">${money(costs.estimatedTripLow)}–${money(costs.estimatedTripHigh)} estimated</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${costRows}</table><p style="font-size:11px;line-height:1.6">Planning estimates only. Confirm final prices and availability with each provider.</p></div>` : "";
  const ports = Array.isArray(journey?.ports) ? journey.ports.map((port) => `${escapeHtml(port.name)}${port.country ? `, ${escapeHtml(port.country)}` : ""}`).join(" → ") : "";
  const journeyHtml = journey?.type === "cruise" ? `<div style="margin-top:38px;border-top:1px solid #d8d4ce;padding-top:22px"><p style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#777">Ocean journey</p><h2 style="font-family:Georgia,serif;font-size:27px;font-weight:400;margin:10px 0 14px">${escapeHtml(journey.title)}</h2>${ports ? `<p style="font-size:12px;line-height:1.8;color:#555">${ports}</p>` : ""}<p style="font-size:12px;line-height:1.8;color:#555">Ship: ${journey.ship?.name ? escapeHtml(journey.ship.name) : "Pending verified sailing inventory"}<br>Flights: ${escapeHtml(journey.flight?.origin || "Origin pending")} → ${escapeHtml(journey.flight?.destination || "port")}${journey.flight?.departureDate ? ` · ${escapeHtml(journey.flight.departureDate)}` : " · dates flexible"}<br>${escapeHtml(journey.flight?.providerStatus || "Live itinerary not connected")}<br>Cruise: ${escapeHtml(journey.cruiseProviderStatus || "Provider link pending")}</p></div>` : "";
  const title = journey?.type === "cruise" ? journey.title : `${days.length} days in ${model.destination?.city || model.destination?.name || "your destination"}`;
  const preheader = journey?.type === "cruise" ? `Your ${journey.duration || "ocean"} Globtrek journey.` : `Your complete ${days.length}-day Globtrek itinerary.`;
  const hero = emailImage(model.destinationImage, model.destination?.city || model.destination?.name || "Destination");
  return shell({ preheader, eyebrow: "One tab travel", title, body: `${hero}${logistics}${hotelHtml}${flightHtml}<div style="margin-top:42px"><p style="font-size:9px;letter-spacing:.2em;text-transform:uppercase">Your itinerary</p>${dayHtml}</div>${diningHtml}${experienceHtml}${costHtml}${journeyHtml}${viewUrl ? button("View trip", viewUrl) : ""}`, footer: "This transactional trip email does not subscribe you to marketing. Confirm final prices and availability with each provider." });
}

export function monthlyEmail({ unsubscribeUrl, siteUrl }) {
  const ideas = [["Provence", "Markets, village roads, and a slower rhythm."], ["Kyoto", "Ritual, food, and quiet depth."], ["Maui", "A warm-weather reset shaped around a real budget."]];
  const rows = ideas.map(([name, note]) => `<div style="border-top:1px solid #d8d4ce;padding:22px 0"><h2 style="font-family:Georgia,serif;font-size:27px;font-weight:400;margin:0 0 8px">${name}</h2><p style="font-size:13px;line-height:1.6;color:#555">${note}</p></div>`).join("");
  return shell({ preheader: "Three places worth considering this month.", eyebrow: "The monthly edit", title: "Where the season leads.", body: `${rows}${button("Build a trip", siteUrl)}`, footer: `You receive this because you opted in to Globtrek travel emails. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#171714">Unsubscribe</a>.` });
}

export { escapeHtml };
