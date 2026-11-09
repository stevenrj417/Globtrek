import type { Adapter } from "./types.ts";

// Booking.com accommodation checkout ("Enter your details" step of book.html).
//
// DISABLED on the live site. Booking.com's Customer Terms of Service (A15.2,
// reviewed 2026-11-09, US page updated 25 Aug 2025) say Booking.com "does not
// authorize the use of automated means", explicitly including automated
// assistants that operate through the customer's browser, "to make bookings or
// reservations" without its prior written permission. Until GlobTrek has that
// permission in writing, travelers get the exact CJ deep link plus copy buttons.
// The field map below is kept, versioned and tested against sanitized fixtures so
// the adapter can be switched on the day permission is granted — after its
// selectors are re-verified on a live checkout by a person.
export const bookingAdapter: Adapter = {
  id: "booking",
  name: "Booking.com",
  selectorsVersion: "2026-11-09.1",
  hosts: ["www.booking.com", "secure.booking.com"],
  policy: {
    autofill: false,
    reason: "Booking.com's terms don't allow automated assistants to fill in or make bookings without written permission, so the assistant opens the exact link and gives you copy buttons instead.",
    termsUrl: "https://www.booking.com/content/terms.html",
    reviewedOn: "2026-11-09",
  },
  pages: [
    { kind: "payment", path: /^\/book\.html/, marker: ["[autocomplete^='cc-']", "iframe[title*='payment' i]", "[data-component*='payment' i]"] },
    { kind: "details", path: /^\/book\.html/ },
    { kind: "product", path: /^\/hotel\// },
    { kind: "search", path: /^\/searchresults/ },
    { kind: "confirmation", path: /^\/confirmation/ },
  ],
  fields: [
    { key: "lead.firstName", selectors: ["input#firstname", "input[name='firstname']", "input[autocomplete='given-name']"] },
    { key: "lead.lastName", selectors: ["input#lastname", "input[name='lastname']", "input[autocomplete='family-name']"] },
    { key: "contact.email", selectors: ["input#email", "input[name='email']", "input[autocomplete='email']:not([name*='confirm'])"] },
    { key: "contact.email", selectors: ["input#email_confirm", "input[name='email_confirm']"] },
    { key: "contact.phone", selectors: ["input#phone", "input[name='phone']", "input[autocomplete='tel']"] },
    { key: "contact.addressLine1", selectors: ["input#address1", "input[name='address1']", "input[autocomplete='address-line1']"], optional: true },
    { key: "contact.city", selectors: ["input#city", "input[name='city']", "input[autocomplete='address-level2']"], optional: true },
    { key: "contact.postalCode", selectors: ["input#zip", "input[name='zip']", "input[autocomplete='postal-code']"], optional: true },
    { key: "contact.country", selectors: ["select#cc1", "select[name='cc1']", "select[autocomplete='country']"], control: "select", match: "country", optional: true },
    { key: "stay.specialRequests", selectors: ["textarea#remarks", "textarea[name='remarks']"], control: "textarea", optional: true },
    { key: "stay.arrivalHour", selectors: ["select#checkin_eta_hour", "select[name='checkin_eta_hour']"], control: "select", match: "hour", optional: true },
  ],
  unsupported: [
    { label: "Room selection and price", reason: "You choose the room and see the live price on Booking.com." },
    { label: "Booking for someone else / guest names per room", reason: "Varies by property; fill in on Booking.com." },
    { label: "Hotel loyalty numbers", reason: "Booking.com doesn't collect hotel-chain loyalty numbers at checkout." },
    { label: "Payment details", reason: "Never filled by GlobTrek. Use Chrome's payment autofill or type them on Booking.com." },
  ],
  guidance: {
    search: "Pick your property on Booking.com. The assistant can help once you reach the guest details page.",
    product: "Choose a room and select Reserve on Booking.com. The assistant helps on the next page, \"Enter your details\".",
    payment: "Review and pay on the partner site.",
  },
  timeoutMs: 8000,
  maxPasses: 3,
};
