import type { Adapter } from "./types.ts";

// Booking.com accommodation checkout ("Enter your details" step of book.html).
//
// OFF (2026-11-21, owner's decision: GlobTrek follows every partner rule).
// Booking.com's Customer Terms (A15.2) say it "does not authorize the use of
// automated means", including browser assistants that work through the
// browser, "to make bookings or reservations" without prior written
// permission. Turn this on only with that written permission.
// Selectors are tested against sanitized fixtures; re-check them on a live
// checkout when Booking.com changes its form.
export const bookingAdapter: Adapter = {
  id: "booking",
  name: "Booking.com",
  selectorsVersion: "2026-11-09.1",
  hosts: ["www.booking.com", "secure.booking.com"],
  policy: {
    autofill: false,
    reason: "Booking.com doesn't allow assistants to fill in its booking form. Your details are ready to copy.",
    termsUrl: "https://www.booking.com/content/terms.html",
    reviewedOn: "2026-11-21",
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
    { key: "stay.specialRequests", selectors: ["textarea#remarks", "textarea[name='remarks']"], control: "textarea", optional: true },
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
