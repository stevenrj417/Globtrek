# Partners: terms review and field-support matrix

Reviewed **2026-11-09**. Re-check before every release; partners change both terms and markup.

## Terms review

| Partner | Clause | Decision |
|---|---|---|
| **Booking.com** | Customer Terms A15.2 (US page updated 25 Aug 2025): Booking.com "does not authorize the use of automated means", naming automated assistants that operate through the customer's browser, "to make bookings or reservations" without prior written permission. A15.3 says such tools will be blocked; A18 allows cancelling bookings. A new version takes effect 10 Dec 2026 (not yet read). | **Autofill ON by the owner's decision (2026-11-20, extension 0.3.0)**, accepting the risk under A15.2/A15.3 and to the CJ affiliate account. Only name, email, phone and the optional note on the hotel "Enter your details" step. Never submits, ticks terms or touches payment. Re-verify selectors on a live checkout. |
| **OpenTable** | Terms of Use: users may not use "automated assistants or other automatic … means" that operate by "interacting with or otherwise making use of your browser" to access any portion of the Services. | **Autofill ON by the owner's decision (2026-11-20, extension 0.3.0)**, accepting the risk under these terms. Name, email, phone and the optional note on the "Diner details" step; link carries date, time and party size. Never submits. |
| **GetYourGuide** | General Terms: prohibits "automated systems or software, such as bots, scrapers, spiders, or crawlers" used to "access, extract, copy, or index any content or data" without consent. Nothing about form-filling assistants. | **Autofill on**, as a judgment call: the assistant runs only in the traveler's own tab after they ask, writes their own details into visible fields, extracts and indexes nothing, never submits. **Steven should confirm** — or ask GetYourGuide's partner team — and set `policy.autofill = false` in `src/adapters/getyourguide.ts` if in doubt. Note: GlobTrek's trips don't currently link to GetYourGuide at all (paid activities go to Booking.com Attractions). |
| **GlobTrek / Duffel** | GlobTrek's own future checkout. | Contract defined (`data-globtrek-field` attributes); **off** until the page exists. No Duffel credentials anywhere. |
| **Chrome Web Store** | Program policies (Limited Use, Use of Permissions, MV3 remote code, Affiliate Ads, Single Purpose) — summary in `SECURITY.md`. | Followed: narrowest permissions, no remote code, privacy policy, affiliate disclosure, links opened only on user click. |

The assistant never bypasses CAPTCHAs, bot checks, sign-in or site restrictions, never impersonates the user, and never accepts terms.

## Field-support matrix

"Fixture-verified" means the adapter fills the field on the sanitized fixture in `tests/fixtures` (unit test + real-Chrome e2e). **No selector has been verified against a partner's live markup**, because GlobTrek does not scrape partners; a person must check each one on a real checkout before an adapter is enabled or released.

### GetYourGuide (on) — selectors `2026-11-09.1`

| Field | Profile source | Status |
|---|---|---|
| First name | lead traveler legal first name | fixture-verified |
| Last name | lead traveler legal last name | fixture-verified |
| Email | contact email | fixture-verified |
| Phone country code (select) | contact phone country code, matched by dial code | fixture-verified |
| Phone number | contact phone (national part) | fixture-verified |
| Notes for the provider (textarea) | lead traveler accessibility request | fixture-verified (optional) |
| Date, time, tickets, pickup, per-participant names | — | not filled (chosen by the traveler) |
| Payment | — | never |

### Booking.com (on — owner's decision) — selectors `2026-11-09.1`

| Field | Profile source | Status |
|---|---|---|
| First / last name | lead legal names | fixture-verified |
| Email + confirm email | contact email | fixture-verified |
| Phone | `+cc number` | fixture-verified |
| Special requests | room + bed + accessibility + dietary + requests | fixture-verified (optional) |
| Address, city, postal code, country, arrival time | — | not filled (GlobTrek doesn't ask for them) |
| Room choice, guest-per-room names, loyalty, payment | — | not supported |

### OpenTable (on — owner's decision) — selectors `2026-11-09.1`

| Field | Profile source | Status |
|---|---|---|
| First / last name | lead legal names | fixture-verified |
| Phone | contact phone | fixture-verified |
| Email | contact email | fixture-verified |
| Special request | dietary + accessibility | fixture-verified (optional) |
| Date, time, party size, occasion, opt-ins, card hold | — | not supported |

### GlobTrek flight checkout (off — not built) — contract `contract-1`

Passenger 0 given/middle/family name, date of birth, email, phone; passport number, issuing country, expiry (only after per-page passport confirmation). Additional passengers, seats, bags and meals are preferences, never shown as confirmed.

### Everything else

Booking.com Flights and Attractions (via CJ), Resy, Tock, SevenRooms, TheFork, Quandoo and Google Maps links open exactly as GlobTrek supplies them, with copy buttons. No script is injected.

## When a partner changes its markup

The engine reports each field it couldn't find (`not_found`) with the adapter's selector version; the booking shows **Needs attention** with "the page may have changed — use the copy buttons". Update selectors, bump `selectorsVersion`, update the fixture, re-run `npm test` and `npm run test:e2e`.
