function minutes(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const total = Number(match[1]) * 60 + Number(match[2]);
  return total >= 0 && total < 1440 ? total : null;
}

export function validateItineraryTiming({ arrivalTime, departureTime, hotelCheckIn = "15:00", items = [] }) {
  const errors = [];
  const arrival = minutes(arrivalTime);
  const departure = minutes(departureTime);
  const checkIn = minutes(hotelCheckIn);
  const normalized = items.map((item, index) => ({ ...item, index, startMinutes: minutes(item.start), endMinutes: minutes(item.end) }));
  for (const item of normalized) {
    if (item.startMinutes == null || item.endMinutes == null || item.endMinutes <= item.startMinutes) { errors.push({ code: "invalid_time", index: item.index }); continue; }
    if (arrival != null && item.day === 1 && item.startMinutes < arrival + 90) errors.push({ code: "before_arrival_buffer", index: item.index });
    if (departure != null && item.isDepartureDay && item.endMinutes > departure - 120) errors.push({ code: "departure_buffer", index: item.index });
    if (item.requiresHotelCheckIn && checkIn != null && item.startMinutes < checkIn) errors.push({ code: "before_check_in", index: item.index });
  }
  const byDay = new Map();
  normalized.filter((item) => item.startMinutes != null && item.endMinutes != null).forEach((item) => { const list = byDay.get(item.day) || []; list.push(item); byDay.set(item.day, list); });
  for (const list of byDay.values()) {
    list.sort((a, b) => a.startMinutes - b.startMinutes);
    for (let index = 1; index < list.length; index += 1) if (list[index].startMinutes < list[index - 1].endMinutes + Number(list[index].transportMinutes || 0)) errors.push({ code: "overlap_or_transport", index: list[index].index });
  }
  return { valid: errors.length === 0, errors, checkedItems: normalized.length };
}
