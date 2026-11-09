# GlobTrek One Tab Booking Assistant — plan

## What exists on the website (audited 2026-11-09)

- `app/lib/booking/manifest.js` builds the **booking manifest** (`hotelBookings`, `flightBooking`, `experienceBookings`, `restaurantBookings`). Every hotel and flight leaves through GlobTrek's **CJ** link to Booking.com; every paid activity becomes a CJ-wrapped **Booking.com Attractions** search; free places keep their own site; restaurants link to their reservation platform (OpenTable, Resy…) or website.
- `app/components/BookingChecklist.jsx` renders the manifest as the checklist on `/results` (the trip) and `/book` (the email-able "Book everything" page). `TripDock`'s **Book** scrolls to it.
- `app/book/TravelerDetails.jsx` already keeps the lead traveler's contact details in `localStorage` with copy buttons.
- There are **no** GetYourGuide links and **no** Duffel checkout in the product today.

## Approach

1. The website stays the source of truth for *what* to book. It sends the extension only the checklist's exact URLs plus destination, dates and party size, through a content-script bridge on `www.glob-trek.com` (`app/lib/booking/assistant.js` ↔ `extension/src/content/bridge.ts`). The extension re-validates everything (`extension/src/shared/schema.ts`).
2. Traveler details are entered **inside the extension** and never touch the website.
3. Adapters are **data** (hosts, page rules, selectors); one engine fills; nothing clicks or submits.
4. Partner terms decide whether an adapter is on (see `PARTNERS.md`). Off means: exact deep link + copy buttons.
5. The site shows statuses (never details) on the same checklist, so GlobTrek stays the central page.

## Order followed

Audit → plan and matrix → schemas and secure local profile → website detection/messaging → guided session and tabs → Booking.com, GetYourGuide, OpenTable adapters → Duffel contract → website Book flow → privacy controls and docs → tests and fixtures → full test/lint/build → ZIP and store assets → report.
