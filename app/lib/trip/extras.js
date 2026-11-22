import { CJ_LINKS, cjTracked } from "../booking/cj.js";
import { intuiTransferPage } from "../../data/intuiTransfers.js";
import { esimCountry } from "../extras/esim.js";

// "Don't forget" extras for a trip: rides, cars, tours, food and essentials, chosen
// for the trip's budget level. Every link is real: a partner GlobTrek is signed up
// with (Booking.com through CJ, Intui and Airalo through Travelpayouts), Uber's
// public ride link, or a Google Maps search. Nothing here has a price, because no
// partner gives one without a search; the partner shows it. A budget trip never
// sees private drivers, yachts or fine dining; a luxury trip sees them first.
import { LEVELS, cleanInterests } from "./extraInterests.js";
export { EXTRA_INTERESTS, LEVELS, cleanInterests, levelFrom } from "./extraInterests.js";
const at = (level) => Math.max(0, LEVELS.indexOf(level));

const coordinate = (value) => (Number.isFinite(Number(value)) && value !== null && value !== "" ? Number(value).toFixed(6) : null);

// Uber's public ride link (https://m.uber.com/ul/?action=setPickup), with pickup and
// drop-off filled in. Uber's link can't carry a time or flight number: the traveler
// picks "Reserve" in Uber and adds the flight there.
export function uberRideLink(from, to) {
  const params = new URLSearchParams({ action: "setPickup" });
  for (const [key, point] of [["pickup", from], ["dropoff", to]]) {
    const latitude = coordinate(point?.latitude);
    const longitude = coordinate(point?.longitude);
    if (!latitude || !longitude) return null;
    params.set(`${key}[latitude]`, latitude);
    params.set(`${key}[longitude]`, longitude);
    if (point.name) params.set(`${key}[nickname]`, String(point.name).slice(0, 80));
    if (point.address) params.set(`${key}[formatted_address]`, String(point.address).slice(0, 160));
  }
  // Uber's examples use plain brackets in the parameter names.
  return `https://m.uber.com/ul/?${params.toString().replaceAll("%5B", "[").replaceAll("%5D", "]")}`;
}

const attractionsUrl = (query) => `https://www.booking.com/attractions/searchresults.html?${new URLSearchParams({ query }).toString()}`;
const mapsSearch = (query) => `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query }).toString()}`;
const transit = (from, to) => `https://www.google.com/maps/dir/?${new URLSearchParams({ api: "1", origin: from, destination: to, travelmode: "transit" }).toString()}`;

// trip: { level, interests[], destination: { name, country }, airport: { code, name, latitude, longitude, km } | null,
//         stay: { name, latitude, longitude, street, city } | null, homeCountry, sid }
// Returns sections in a fixed order; empty sections are dropped. Items the
// traveler asked for in the quiz come first and are marked.
export function tripExtras(trip = {}) {
  const level = LEVELS.includes(trip.level) ? trip.level : "mid";
  const rank = at(level);
  const wants = new Set(cleanInterests(trip.interests));
  const place = [trip.destination?.name, trip.destination?.country].filter(Boolean).join(", ");
  const town = trip.destination?.name || "your destination";
  const airport = trip.airport?.code ? trip.airport : null;
  const stay = trip.stay || null;
  const stayPoint = stay && coordinate(stay.latitude) ? { latitude: stay.latitude, longitude: stay.longitude, name: stay.name, address: [stay.street, stay.city].filter(Boolean).join(", ") || null } : null;
  const airportPoint = airport && coordinate(airport.latitude) ? { latitude: airport.latitude, longitude: airport.longitude, name: `${airport.name} (${airport.code})` } : null;
  const sid = trip.sid;
  const cj = (program, url) => cjTracked(CJ_LINKS[program], url, sid);
  const attractions = (query) => cj("activities", attractionsUrl(query));
  const far = (airport?.km || 0) >= 40;
  // Past ~80 km an Uber is a long, pricey ride; a car or transfer makes more sense.
  const rideable = airportPoint && stayPoint && (airport.km || 0) <= 80;
  const item = (id, interest, fields) => ({ id, interest, wanted: interest ? wants.has(interest) : false, ...fields });

  const transport = [
    rideable ? item("uber-arrive", "rides", { title: `Uber from ${airport.code} to ${stay.name}`, why: "Pickup and drop-off are filled in. In Uber, tap Reserve to schedule it and add your flight number, so the driver knows if you land late.", href: uberRideLink(airportPoint, stayPoint), partner: "Uber", sponsored: false, cta: "Open in Uber" }) : null,
    rideable ? item("uber-depart", "rides", { title: `Uber back to ${airport.code} on your last day`, why: "The same ride, the other way. Reserve it the night before so you're not waiting at checkout.", href: uberRideLink(stayPoint, airportPoint), partner: "Uber", sponsored: false, cta: "Open in Uber" }) : null,
    rank <= 1 && airport ? item("transit", "rides", { title: `Public transport from ${airport.code}`, why: `Usually the cheapest way into ${town}. Opens Google Maps with the route from the airport.`, href: transit(`${airport.name} (${airport.code})`, stay ? [stay.name, stay.city].filter(Boolean).join(", ") : place), partner: "Google Maps", sponsored: false, cta: "See the route" }) : null,
    rank >= 1 ? item("taxi", "rides", { title: "Prebooked airport taxi", why: "A fixed price agreed before you fly. Add your flight number when you book so the driver meets you at arrivals.", href: cj("taxis", "https://taxi.booking.com/"), partner: "Booking.com", sponsored: true, cta: "Book a taxi" }) : null,
    rank >= 2 ? item("driver", "driver", { title: "Private driver or transfer", why: `A driver waiting with your name, door to door${airport ? ` from ${airport.code}` : ""}. Good with luggage or a late arrival.`, href: intuiTransferPage(trip.destination?.country) ? `/go/transfer?country=${encodeURIComponent(trip.destination.country)}` : null, partner: "Intui", sponsored: true, cta: "See transfers" }) : null,
    item("car", "car", { title: far ? `Rental car from ${airport.code}` : "Rental car", why: far ? `${town} is ${airport.km} km from the airport. A car is often cheaper than two long taxi rides, and you can explore on your own time.` : "Worth it for day trips out of town. Pick up and drop off at the airport.", href: cj("cars", "https://cars.booking.com/"), partner: "Booking.com", sponsored: true, cta: "Compare cars" }),
  ];

  const luxury = rank >= 2 ? [
    item("private-tour", "luxury", { title: `Private tours in ${town}`, why: "Just your group and a guide, at your pace.", href: attractions(`private tour ${place}`), partner: "Booking.com", sponsored: true, cta: "See private tours" }),
    item("boat", "luxury", { title: "Boat and yacht trips", why: "Charters and boat days near you, if the coast or a lake is close.", href: attractions(`boat trip ${place}`), partner: "Booking.com", sponsored: true, cta: "See boat trips" }),
    rank >= 3 ? item("guide", "luxury", { title: "A personal guide for a day", why: "A local who plans the day around what you like.", href: attractions(`private guide ${place}`), partner: "Booking.com", sponsored: true, cta: "Find a guide" }) : null,
    rank >= 3 ? item("chef", "luxury", { title: "A private chef or in-villa dining", why: "Best booked direct. Opens a map search for chefs and caterers nearby, so you can compare and call.", href: mapsSearch(`private chef ${place}`), partner: "Google Maps", sponsored: false, cta: "Search nearby" }) : null,
  ] : [];

  const activities = [
    item("tours", "tours", { title: rank === 0 ? `Free and low-cost tours in ${town}` : `Tours and day trips from ${town}`, why: rank === 0 ? "Walking tours and city passes keep costs down. Book ahead in busy months." : "Skip-the-line tickets, day trips and guided tours, with free cancellation on many.", href: attractions(rank === 0 ? `walking tour ${place}` : `tours ${place}`), partner: "Booking.com", sponsored: true, cta: "See tours" }),
    rank >= 1 ? item("tickets", "tours", { title: "Museum and attraction tickets", why: "Timed tickets sell out at the big sights. Book them for the mornings you're free.", href: attractions(`tickets ${place}`), partner: "Booking.com", sponsored: true, cta: "See tickets" }) : null,
  ];

  const dining = [
    item("food-tour", "food", { title: rank === 0 ? "Street food and market tours" : "Food tours and cooking classes", why: rank === 0 ? "The cheapest way to try a lot of local food in one go." : "Eat like a local for an afternoon, or learn to cook a dish to take home.", href: attractions(`${rank === 0 ? "street food" : "food tour cooking class"} ${place}`), partner: "Booking.com", sponsored: true, cta: "See food tours" }),
    rank >= 2 ? item("fine-dining", "food", { title: `The best tables in ${town}`, why: "Tasting menus and chef's tables book up weeks ahead. See them on a map and reserve direct.", href: mapsSearch(`fine dining ${place}`), partner: "Google Maps", sponsored: false, cta: "See on the map" }) : item("cheap-eats", "food", { title: `Good cheap eats in ${town}`, why: "Local spots near your stay, on a map, with reviews.", href: mapsSearch(`cheap eats ${stay ? [stay.name, stay.city].filter(Boolean).join(", ") : place}`), partner: "Google Maps", sponsored: false, cta: "See on the map" }),
  ];

  const abroad = trip.destination?.country && (!trip.homeCountry || trip.homeCountry.toLowerCase() !== trip.destination.country.toLowerCase());
  const essentials = [
    abroad && esimCountry(trip.destination.country) ? item("esim", "esim", { title: `Phone data for ${trip.destination.country}`, why: "An eSIM costs far less than roaming. Install it before you fly and switch it on when you land.", href: `/go/esim?country=${encodeURIComponent(trip.destination.country)}`, partner: "Airalo", sponsored: true, cta: "See eSIM plans" }) : null,
    item("luggage", null, { title: "Luggage storage", why: "Checkout before your flight? Drop your bags and keep exploring. Opens storage spots near you on a map.", href: mapsSearch(`luggage storage ${place}`), partner: "Google Maps", sponsored: false, cta: "Find storage" }),
  ];

  const order = (items) => items.filter((entry) => entry?.href).sort((a, b) => Number(b.wanted) - Number(a.wanted));
  return [
    { id: "transport", title: "Getting around", items: order(transport) },
    { id: "luxury", title: "Make it special", items: order(luxury) },
    { id: "activities", title: "More to do", items: order(activities) },
    { id: "dining", title: "Food and dining", items: order(dining) },
    { id: "essentials", title: "Travel essentials", items: order(essentials) },
  ].filter((section) => section.items.length);
}
