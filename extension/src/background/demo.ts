import type { TripPayload } from "../shared/schema.ts";

// Development builds only: a trip whose links point at the local sanitized
// fixture server, so the whole flow can be exercised without touching a partner.
export const DEMO_TRIP: TripPayload = {
  tripId: "dev-demo",
  destination: { city: "Lisbon", country: "Portugal" },
  dates: { start: "2027-04-12", end: "2027-04-17" },
  travelers: { adults: 2, children: 0, infants: 0 },
  flight: { origin: "JFK", destination: "LIS", departureDate: "2027-04-12", returnDate: "2027-04-17", cabin: "ECONOMY" },
  items: [
    { id: "hotel-0", type: "hotel", name: "Fixture: Booking.com guest details", url: "http://localhost:4599/booking/book.html?hotel_id=fixture", date: "2027-04-12", time: null },
    { id: "experience-0", type: "experience", name: "Fixture: GetYourGuide checkout", url: "http://localhost:4599/getyourguide/checkout/fixture", date: "2027-04-14", time: "10:00" },
    { id: "restaurant-0", type: "restaurant", name: "Fixture: OpenTable diner details", url: "http://localhost:4599/opentable/booking/details", date: "2027-04-13", time: "19:30" },
    { id: "payment-0", type: "experience", name: "Fixture: GetYourGuide payment step", url: "http://localhost:4599/getyourguide/checkout/payment", date: null, time: null },
  ],
};

// Development builds only, for store screenshots: production behaviour on a realistic
// trip. The stay and dinner use real partner links (Booking.com via GlobTrek's CJ link,
// OpenTable) whose autofill is off; the activity uses the GetYourGuide fixture.
export const SHOWCASE_TRIP: TripPayload = {
  tripId: "dev-showcase",
  destination: { city: "Lisbon", country: "Portugal" },
  dates: { start: "2027-04-12", end: "2027-04-17" },
  travelers: { adults: 2, children: 0, infants: 0 },
  flight: null,
  items: [
    { id: "hotel-0", type: "hotel", name: "Memmo Alfama", url: "https://www.kqzyfj.com/click-101801755-17293132?url=" + encodeURIComponent("https://www.booking.com/hotel/pt/memmo-alfama.html?checkin=2027-04-12&checkout=2027-04-17&group_adults=2&no_rooms=1&group_children=0"), date: "2027-04-12", time: null },
    { id: "experience-0", type: "experience", name: "Sintra and Pena Palace day trip", url: "http://localhost:4599/getyourguide/checkout/fixture", date: "2027-04-14", time: "09:30" },
    { id: "restaurant-0", type: "restaurant", name: "Taberna da Rua das Flores", url: "https://www.opentable.com/r/taberna-da-rua-das-flores-lisboa?covers=2", date: "2027-04-13", time: "19:30" },
    { id: "experience-1", type: "experience", name: "Fado evening in Alfama", url: "http://localhost:4599/getyourguide/checkout/payment", date: "2027-04-15", time: "20:00" },
  ],
};
