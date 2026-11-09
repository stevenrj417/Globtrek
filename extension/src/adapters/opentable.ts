import type { Adapter } from "./types.ts";

// OpenTable reservation details ("Diner details").
//
// DISABLED on the live site. OpenTable's Terms of Use (reviewed 2026-11-09) bar
// using "automated assistants" or AI that "operate by interacting with or
// otherwise making use of your browser" to access any portion of the Services.
// The assistant opens the exact OpenTable link (party size pre-filled by
// GlobTrek) and offers copy buttons. GlobTrek's pending OpenTable partner
// application (docs/opentable.md) is the route to an approved flow.
export const openTableAdapter: Adapter = {
  id: "opentable",
  name: "OpenTable",
  selectorsVersion: "2026-11-09.1",
  hosts: ["www.opentable.com", "www.opentable.co.uk", "www.opentable.ca", "www.opentable.com.au", "www.opentable.de", "www.opentable.ie"],
  policy: {
    autofill: false,
    reason: "OpenTable's terms don't allow browser-based automated assistants, so the assistant opens the exact reservation link and gives you copy buttons instead.",
    termsUrl: "https://www.opentable.com/legal/terms-and-conditions",
    reviewedOn: "2026-11-09",
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
