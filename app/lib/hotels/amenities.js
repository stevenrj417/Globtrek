// The facilities travelers ask about most, checked against a hotel's Booking.com
// listing. A facility missing from the listing is "not listed", not "doesn't have":
// Booking.com listings are written by the hotel and are sometimes incomplete.

const CHECKS = [
  ["WiFi", (a) => /wifi|internet/i.test(a), (a) => (/free wifi/i.test(a) ? "Free" : null)],
  ["Parking", (a) => /parking/i.test(a) && !/no parking/i.test(a), (a) => (/free parking/i.test(a) ? "Free" : null)],
  ["Breakfast", (a, stay) => /breakfast/i.test(a) || stay.freeBreakfast, (a, stay) => (stay.freeBreakfast ? "Included on some rooms" : null)],
  ["Air conditioning", (a) => /air conditioning/i.test(a)],
  ["Pool", (a) => /pool/i.test(a)],
  ["Restaurant", (a, stay) => /restaurant/i.test(a) || Boolean(stay.dining)],
  ["Bar", (a) => /(^|\|)\s*bar\s*(\||$)|snack bar|pool bar/i.test(a)],
  ["Gym", (a) => /fitness|gym/i.test(a)],
  ["Spa", (a) => /\bspa\b|wellness/i.test(a)],
  ["Kitchen", (a) => /kitchen/i.test(a)],
  ["Airport shuttle", (a) => /airport shuttle/i.test(a)],
  ["24-hour front desk", (a) => /24-hour front desk/i.test(a)],
  ["Elevator", (a) => /\blift\b|elevator/i.test(a)],
  ["Laundry", (a) => /laundry/i.test(a)],
  ["Family rooms", (a) => /family rooms/i.test(a)],
  ["Pets allowed", (a) => /(^|\|)\s*pets allowed/i.test(a)],
  ["Wheelchair accessible", (a, stay) => /wheelchair|disabled guests/i.test(a) || (stay.accessibility || []).some((item) => /wheelchair/i.test(item))],
];

// [{ label, has, note }] in a fixed order, facilities the hotel lists first.
export function amenityChecklist(stay) {
  const joined = (stay?.amenities || []).join(" | ");
  const list = CHECKS.map(([label, test, note]) => {
    const has = Boolean(test(joined, stay || {}));
    return { label, has, note: has && note ? note(joined, stay || {}) : null };
  });
  return [...list.filter((item) => item.has), ...list.filter((item) => !item.has)];
}

// Map links built from the catalog's own coordinates and the hotel's name.
export function googleMapsSearchUrl({ name, city, latitude, longitude }) {
  const query = name ? [name, city].filter(Boolean).join(", ") : `${latitude},${longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
