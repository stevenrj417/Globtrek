import { CJ_LINKS, cjTracked } from "./cj.js";

// Book-only links for one hotel or one flight, with the traveler's dates.
const ISO = /^\d{4}-\d{2}-\d{2}$/;
export const addDays = (iso, days) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
export const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export function stayBookingUrl(bookingUrl, { start, end, adults, rooms }) {
  const params = new URLSearchParams({ group_adults: String(adults), no_rooms: String(rooms), group_children: "0" });
  if (ISO.test(start || "") && ISO.test(end || "") && end > start) { params.set("checkin", start); params.set("checkout", end); }
  return cjTracked(CJ_LINKS.stays, `${bookingUrl.split("?")[0]}?${params}`);
}

export function flightBookingUrl({ from, to, start, end, adults, oneWay }) {
  const params = new URLSearchParams({ type: oneWay ? "ONEWAY" : "ROUNDTRIP", cabinClass: "ECONOMY", adults: String(adults), children: "0", from: `${from}.AIRPORT`, to: `${to}.AIRPORT` });
  if (ISO.test(start || "")) params.set("depart", start);
  if (!oneWay && ISO.test(end || "") && end > start) params.set("return", end);
  return cjTracked(CJ_LINKS.flights, `https://flights.booking.com/flights/${from}.AIRPORT-${to}.AIRPORT/?${params}`);
}

