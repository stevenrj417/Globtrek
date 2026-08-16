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

export function tripEmail({ model, viewUrl }) {
  const days = model.itinerary?.days || [];
  const dayHtml = days.map((day, index) => `<section style="border-top:1px solid #d8d4ce;padding:22px 0"><p style="font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#777">Day ${String(index + 1).padStart(2, "0")} · ${escapeHtml(day.location || "")}</p><h2 style="font-family:Georgia,serif;font-size:25px;font-weight:400;margin:8px 0 14px">${escapeHtml(day.title)}</h2><p style="font-size:13px;line-height:1.7;color:#555"><b>Morning</b> ${escapeHtml(day.morning)}<br><b>Afternoon</b> ${escapeHtml(day.afternoon)}<br><b>Evening</b> ${escapeHtml(day.evening)}</p></section>`).join("");
  const costs = model.estimatedCostBreakdown;
  const costHtml = costs ? `<p style="font-size:12px;line-height:1.8;color:#555">Target ${money(costs.targetBudget)} · Estimated ${money(costs.estimatedTripLow)}–${money(costs.estimatedTripHigh)}<br>Prices are estimates unless explicitly marked live.</p>` : "";
  return shell({ preheader: `Your complete ${days.length}-day Globtrek itinerary.`, eyebrow: "Your trip, organized", title: `${days.length} days in ${model.destination?.city || model.destination?.name || "your destination"}`, body: `${costHtml}${viewUrl ? button("View trip", viewUrl) : ""}<div style="margin-top:42px">${dayHtml}</div>`, footer: "This transactional trip email does not subscribe you to marketing. Confirm final prices and availability with each provider." });
}

export function monthlyEmail({ unsubscribeUrl, siteUrl }) {
  const ideas = [["Provence", "Markets, village roads, and a slower rhythm."], ["Kyoto", "Ritual, food, and quiet depth."], ["Maui", "A warm-weather reset shaped around a real budget."]];
  const rows = ideas.map(([name, note]) => `<div style="border-top:1px solid #d8d4ce;padding:22px 0"><h2 style="font-family:Georgia,serif;font-size:27px;font-weight:400;margin:0 0 8px">${name}</h2><p style="font-size:13px;line-height:1.6;color:#555">${note}</p></div>`).join("");
  return shell({ preheader: "Three places worth considering this month.", eyebrow: "The monthly edit", title: "Where the season leads.", body: `${rows}${button("Build a trip", siteUrl)}`, footer: `You receive this because you opted in to Globtrek travel emails. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#171714">Unsubscribe</a>.` });
}

export { escapeHtml };
