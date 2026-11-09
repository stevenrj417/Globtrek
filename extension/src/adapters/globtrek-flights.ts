import type { Adapter } from "./types.ts";

// GlobTrek's own flight checkout, to be powered by Duffel. The checkout page does
// not exist yet: there is no live Duffel integration and no credentials anywhere
// in this repository. This adapter defines the contract that page will follow —
// every passenger field carries a stable `data-globtrek-field` attribute, so no
// brittle selectors are needed — and stays disabled until the page ships.
// Duffel API keys must only ever live on GlobTrek's server.
export const globTrekFlightsAdapter: Adapter = {
  id: "globtrek-flights",
  name: "GlobTrek flight checkout",
  selectorsVersion: "contract-1",
  hosts: ["www.glob-trek.com"],
  policy: {
    autofill: false,
    reason: "GlobTrek's own flight checkout isn't live yet. Flights open on the partner site for now.",
    termsUrl: "https://www.glob-trek.com/terms",
    reviewedOn: "2026-11-09",
  },
  pages: [
    { kind: "payment", path: /^\/flight\/checkout\/pay/ },
    { kind: "details", path: /^\/flight\/checkout/ },
  ],
  fields: [
    { key: "lead.firstName", selectors: ["[data-globtrek-field='passenger.0.given_name']"] },
    { key: "lead.middleName", selectors: ["[data-globtrek-field='passenger.0.middle_name']"], optional: true },
    { key: "lead.lastName", selectors: ["[data-globtrek-field='passenger.0.family_name']"] },
    { key: "lead.dateOfBirth", selectors: ["[data-globtrek-field='passenger.0.born_on']"] },
    { key: "contact.email", selectors: ["[data-globtrek-field='passenger.0.email']"] },
    { key: "contact.phone", selectors: ["[data-globtrek-field='passenger.0.phone_number']"] },
    { key: "passport.number", selectors: ["[data-globtrek-field='passenger.0.identity_document.unique_identifier']"] },
    { key: "passport.issuingCountry", selectors: ["[data-globtrek-field='passenger.0.identity_document.issuing_country_code']"], control: "select", match: "country" },
    { key: "passport.expiryDate", selectors: ["[data-globtrek-field='passenger.0.identity_document.expires_on']"] },
  ],
  unsupported: [
    { label: "Additional passengers", reason: "Planned: one block per traveler in the party, using the same data-globtrek-field contract." },
    { label: "Seat, bag and meal selection", reason: "Preferences only — never shown as confirmed until the airline confirms." },
  ],
  guidance: {},
  timeoutMs: 8000,
  maxPasses: 2,
};
