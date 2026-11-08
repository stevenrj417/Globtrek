// Rock-bottom lodging and food for "absolute cheapest" trips.
//
// bedNight: the cheapest bed rated 7.5+ with 100+ reviews on Booking.com, per person
// per night, taxes and fees included. Snapshot of a 3-night midweek stay
// (Feb 9–12, 2027; New Orleans Mar 16–19 to skip Mardi Gras), sorted by price,
// checked 2026-11-08. Palm Springs has no hostels; its entry is the cheapest decent
// private room, which is why it is not a budget destination.
// cheapFoodDay: per person per day eating fast food, street food and groceries.

export const CHEAP_STAYS_CHECKED = "2026-11-08";

export const CHEAP_STAYS = Object.freeze({
  LAS: { bedNight: 50, name: "Sin City Hostel", path: "us/sin-city-hostel-las-vegas.html", rating: 8.3, reviewCount: 888, cheapFoodDay: 22 },
  SAN: { bedNight: 37, name: "HI San Diego Downtown Hostel", path: "us/hostelling-international-san-diego.html", rating: 8.6, reviewCount: 1548, cheapFoodDay: 22 },
  LAX: { bedNight: 28, name: "8th and Ardmore", path: "us/8th-and-ardmore.html", rating: 7.9, reviewCount: 700, cheapFoodDay: 22 },
  SFO: { bedNight: 35, name: "HI San Francisco Fisherman's Wharf Hostel", path: "us/hi-sf-fisherman-s-wharf.html", rating: 8.3, reviewCount: 1531, cheapFoodDay: 24 },
  SEA: { bedNight: 61, name: "Green Tortoise Hostel Seattle", path: "us/green-tortoise-hostel-seattle.html", rating: 8.7, reviewCount: 2798, cheapFoodDay: 24 },
  HNL: { bedNight: 39, name: "Polynesian Hostel Beach Club", path: "us/polynesian-hostel-beach-club.html", rating: 8.2, reviewCount: 973, cheapFoodDay: 28 },
  MEX: { bedNight: 12, name: "CASA MX Alameda", path: "mx/casa-mx.html", rating: 7.7, reviewCount: 2259, cheapFoodDay: 10 },
  OAX: { bedNight: 13, name: "Hostel Casa Maguey", path: "mx/casa-maguey-oaxaca-de-juarez.html", rating: 8.2, reviewCount: 317, cheapFoodDay: 10 },
  GDL: { bedNight: 13, name: "Hostel Hospedarte Chapultepec", path: "mx/hostel-hospedarte-chapultepec.html", rating: 8.5, reviewCount: 1126, cheapFoodDay: 10 },
  PVR: { bedNight: 23, name: "Oasis Hostel", path: "mx/oasis-uptown.html", rating: 8.7, reviewCount: 155, cheapFoodDay: 12 },
  MID: { bedNight: 13, name: "Hostal La Ermita", path: "mx/hostal-la-ermita.html", rating: 8.1, reviewCount: 728, cheapFoodDay: 10 },
  LIS: { bedNight: 17, name: "Varandas do Chiado", path: "pt/varandas-de-lisboa-chiado.html", rating: 8.0, reviewCount: 1575, cheapFoodDay: 15 },
  HAN: { bedNight: 5, name: "Hanoi Backpacker Home", path: "vn/hanoi-backpacker-home.html", rating: 8.3, reviewCount: 100, cheapFoodDay: 8 },
  BKK: { bedNight: 7, name: "Sukhum Victorymonument-Ari", path: "th/sukhum-victorymonument-ari.html", rating: 7.9, reviewCount: 154, cheapFoodDay: 8 },
  CNX: { bedNight: 4, name: "Chiang Mai Gate Capsule Hostel", path: "th/lady-dorm-walking-street.html", rating: 8.1, reviewCount: 275, cheapFoodDay: 7 },
  EZE: { bedNight: 16, name: "Puerto Limon Hostel", path: "ar/puerto-limon-hostel.html", rating: 8.1, reviewCount: 2913, cheapFoodDay: 12 },
  MSY: { bedNight: 53, name: "HI New Orleans Hostel", path: "us/hi-new-orleans-new-orleans.html", rating: 9.0, reviewCount: 2615, cheapFoodDay: 22 },
  AUS: { bedNight: 35, name: "Firehouse Hostel", path: "us/firehouse-hostel.html", rating: 8.3, reviewCount: 585, cheapFoodDay: 22 },
  ORD: { bedNight: 45, name: "HI Chicago Hostel", path: "us/hostelling-international-chicago.html", rating: 8.5, reviewCount: 9731, cheapFoodDay: 22 },
  DEN: { bedNight: 43, name: "Hostel Fish", path: "us/hostel-fish-denver2.html", rating: 8.0, reviewCount: 651, cheapFoodDay: 22 },
  PSP: { roomNight: 156, name: "Adara Palm Springs", path: "us/palm-canyon-inn.html", rating: 7.6, reviewCount: 928, cheapFoodDay: 24 },
});

// Month-by-month demand for budget beds, relative to the snapshot month (February;
// March for New Orleans). Modeled from each city's high and low seasons and big
// events (Mardi Gras, Jazz Fest, SXSW, ACL, Guelaguetza, Day of the Dead, Coachella),
// not read from live prices. January → December.
const SEASON = Object.freeze({
  LAS: [1.05, 1, 1.05, 1, 1, 0.85, 0.85, 0.85, 0.95, 1, 1, 1.1],
  SAN: [0.95, 1, 1.05, 1.05, 1.1, 1.25, 1.35, 1.35, 1.1, 1, 0.95, 1],
  LAX: [0.95, 1, 1.05, 1.05, 1.1, 1.2, 1.3, 1.3, 1.1, 1.05, 1, 1.05],
  SFO: [0.95, 1, 1.05, 1.05, 1.1, 1.15, 1.2, 1.2, 1.15, 1.1, 1, 1],
  SEA: [0.95, 1, 1, 1.05, 1.15, 1.35, 1.5, 1.5, 1.3, 1.05, 0.95, 0.95],
  HNL: [1.1, 1, 1, 0.95, 0.9, 1, 1.1, 1.1, 0.9, 0.9, 0.95, 1.15],
  MEX: [1, 1, 1.05, 1.05, 1, 0.95, 1, 1, 0.95, 1.05, 1.1, 1.1],
  OAX: [0.95, 1, 1, 1.05, 0.9, 0.9, 1.25, 1.05, 0.9, 1.25, 1.2, 1.15],
  GDL: [1, 1, 1.05, 1, 0.95, 0.95, 1, 1, 0.95, 1.05, 1, 1.05],
  PVR: [1.1, 1, 1.05, 1.05, 0.85, 0.8, 0.85, 0.85, 0.75, 0.85, 0.95, 1.15],
  MID: [1.05, 1, 1.05, 1.05, 0.95, 0.9, 0.95, 0.95, 0.85, 0.9, 1, 1.1],
  LIS: [0.9, 1, 1.15, 1.35, 1.5, 1.7, 1.8, 1.8, 1.5, 1.3, 1, 1],
  HAN: [1.05, 1, 1, 0.95, 0.9, 0.9, 0.9, 0.9, 0.95, 1, 1.05, 1.05],
  BKK: [1.1, 1, 0.95, 1, 0.9, 0.85, 0.9, 0.9, 0.85, 0.9, 1, 1.15],
  CNX: [1.1, 1, 0.9, 0.95, 0.85, 0.85, 0.85, 0.85, 0.85, 0.95, 1.15, 1.2],
  EZE: [1, 1, 1, 0.95, 0.9, 0.9, 0.95, 0.9, 0.95, 1, 1.05, 1.05],
  MSY: [0.95, 1.4, 1, 1.25, 1.05, 0.85, 0.8, 0.8, 0.85, 1, 0.95, 1],
  AUS: [0.95, 1, 1.5, 1.05, 1.05, 0.95, 0.9, 0.9, 0.95, 1.3, 1, 0.95],
  ORD: [0.85, 1, 0.95, 1.05, 1.15, 1.35, 1.4, 1.4, 1.2, 1.1, 0.95, 0.95],
  DEN: [1, 1, 1.05, 0.95, 1.05, 1.2, 1.25, 1.2, 1.1, 1, 0.95, 1],
  PSP: [1.1, 1, 1.15, 1.4, 0.85, 0.7, 0.65, 0.65, 0.75, 0.9, 1, 1.05],
});

export function cheapStayFor(destination) {
  return CHEAP_STAYS[String(destination?.airport || "").toUpperCase()] || null;
}

// Expected price for the stay in a month (1–12); the snapshot price with no month.
export function stayNightFor(destination, month) {
  const airport = String(destination?.airport || "").toUpperCase();
  const stay = CHEAP_STAYS[airport];
  const base = stay?.bedNight || stay?.roomNight;
  if (!base) return null;
  const factor = month >= 1 && month <= 12 ? SEASON[airport]?.[month - 1] || 1 : 1;
  return Math.max(1, Math.round(base * factor));
}

// Twelve monthly averages for one bed (or the room, where there are no hostels).
export function stayMonthly(destination) {
  return Array.from({ length: 12 }, (_, index) => stayNightFor(destination, index + 1));
}
