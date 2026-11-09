import type { Adapter } from "./types.ts";

// GetYourGuide activity checkout ("Contact details" / "Lead traveler").
//
// Enabled. GetYourGuide's General Terms (reviewed 2026-11-09) prohibit "automated
// systems or software, such as bots, scrapers, spiders, or crawlers" used to
// access, extract, copy or index content without consent. The assistant doesn't
// extract or index anything: it runs only in the traveler's own tab, only after
// they ask, writes their own contact details into visible fields, and never
// submits. That reading is a judgment call recorded in extension/docs/PARTNERS.md;
// flip `autofill` to false if GetYourGuide says otherwise.
//
// GetYourGuide's markup was not captured (no scraping); selectors lean on the
// standard autocomplete tokens and common field names and must be checked on a
// live checkout before each release.
export const getYourGuideAdapter: Adapter = {
  id: "getyourguide",
  name: "GetYourGuide",
  selectorsVersion: "2026-11-09.1",
  hosts: ["www.getyourguide.com"],
  policy: {
    autofill: true,
    reason: "Fills your contact details in your own tab when you ask. Never books or pays.",
    termsUrl: "https://www.getyourguide.com/c/general-terms-and-conditions/",
    reviewedOn: "2026-11-09",
  },
  pages: [
    { kind: "payment", path: /\/(checkout|payment)/, marker: ["[autocomplete^='cc-']", "iframe[title*='payment' i]", "[data-test-id*='payment-method' i]"] },
    { kind: "details", path: /\/(checkout|booking)/ },
    { kind: "product", path: /-t\d+\/?/ },
    { kind: "search", path: /^\/s\/?/ },
  ],
  fields: [
    { key: "lead.firstName", selectors: ["input[autocomplete='given-name']", "input[name='firstName']", "input#firstName"] },
    { key: "lead.lastName", selectors: ["input[autocomplete='family-name']", "input[name='lastName']", "input#lastName"] },
    { key: "contact.email", selectors: ["input[autocomplete='email']", "input[type='email']", "input[name='email']"] },
    { key: "contact.phoneCountryCode", selectors: ["select[autocomplete='tel-country-code']", "select[name='phoneCountryCode']", "select[name='countryCode']"], control: "select", match: "dial-code" },
    { key: "contact.phoneNational", selectors: ["input[autocomplete='tel-national']", "input[name='phoneNumber']", "input[name='phone']", "input[type='tel']"] },
    { key: "activity.comments", selectors: ["textarea[name='comment']", "textarea[name='specialRequirements']"], control: "textarea", optional: true },
  ],
  unsupported: [
    { label: "Date, time and ticket options", reason: "Chosen by you on GetYourGuide before checkout." },
    { label: "Per-participant names and ages", reason: "Only some activities ask; fill in on GetYourGuide." },
    { label: "Pickup location", reason: "Depends on the activity; choose it on GetYourGuide." },
    { label: "Payment details", reason: "Never filled by GlobTrek. Review and pay on GetYourGuide." },
  ],
  guidance: {
    search: "Open the activity you want on GetYourGuide.",
    product: "Choose a date, time and tickets, then continue to checkout. The assistant fills your contact details there.",
    payment: "Review and pay on the partner site.",
  },
  timeoutMs: 10000,
  maxPasses: 3,
};
