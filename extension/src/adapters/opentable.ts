import type { Adapter } from "./types.ts";

// OpenTable reservation details ("Diner details").
//
// OFF (2026-11-21, owner's decision: GlobTrek follows every partner rule).
// OpenTable's Terms of Use bar "automated assistants" that operate through the
// user's browser "except as expressly authorized by OpenTable". GlobTrek has no
// OpenTable partnership. Turn this on only with OpenTable's written permission.
export const openTableAdapter: Adapter = {
  id: "opentable",
  name: "OpenTable",
  selectorsVersion: "2026-11-09.1",
  hosts: ["www.opentable.com", "www.opentable.co.uk", "www.opentable.ca", "www.opentable.com.au", "www.opentable.de", "www.opentable.ie"],
  policy: {
    autofill: false,
    reason: "OpenTable doesn't allow assistants to fill in its booking form. Your details are ready to copy.",
    termsUrl: "https://www.opentable.com/legal/terms-and-conditions",
    reviewedOn: "2026-11-21",
  },
  pages: [
    { kind: "details", path: /^\/booking\/details/ },
    { kind: "confirmation", path: /^\/booking\/(view|confirmation)/ },
    { kind: "product", path: /^\/(r|restaurant)\// },
  ],
  fields: [
    { key: "lead.firstName", selectors: ["input#firstName", "input[name='firstName']", "input[autocomplete='given-name']"] },
    { key: "lead.lastName", selectors: ["input#lastName", "input[name='lastName']", "input[autocomplete='family-name']"] },
    { key: "contact.phoneNational", selectors: ["input#phoneNumber", "input[name='phoneNumber']", "input[autocomplete='tel-national']", "input[type='tel']"] },
    { key: "contact.email", selectors: ["input#email", "input[name='email']", "input[autocomplete='email']"] },
    { key: "dining.specialRequests", selectors: ["textarea#specialRequests", "textarea[name='specialRequests']", "textarea[name='specialRequest']"], control: "textarea", optional: true },
  ],
  unsupported: [
    { label: "Date, time and party size", reason: "Chosen on OpenTable (GlobTrek's link pre-fills party size)." },
    { label: "Occasion", reason: "Optional; choose on OpenTable if you'd like." },
    { label: "Credit card hold", reason: "Some restaurants require one. Never filled by GlobTrek." },
    { label: "Marketing opt-ins", reason: "Left for you to decide." },
  ],
  guidance: {
    product: "Pick a time on OpenTable. The diner details page comes next.",
  },
  timeoutMs: 8000,
  maxPasses: 3,
};
