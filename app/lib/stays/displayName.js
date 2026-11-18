// Booking.com listing titles sometimes carry a sales pitch after a dash
// ("Motel Bella Inn - Free Parking"). Show the property's name without it.
const PITCH = /\b(free|parking|wi-?fi|breakfast|pool|spa|jacuzzi|hot tub|netflix|self check-?in|kitchen|balcony|terrace|garden|view|near|close to|next to|steps from|walk to|min(ute)?s? (from|to)|by the|airport|cent(er|re)|downtown|old town|beach|sea|ocean|lake|metro|station)\b/i;

export function stayDisplayName(name) {
  const value = String(name || "").trim();
  const parts = value.split(/\s+[-–—|]\s+/);
  if (parts.length < 2) return value;
  while (parts.length > 1 && PITCH.test(parts.at(-1))) parts.pop();
  return parts.join(" - ");
}
