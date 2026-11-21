# Site bridge (not used by the website)

The GlobTrek website stopped using the Booking Assistant on 2026-11-21. These are
the pieces that lived in the site, kept here so the extension can come back later:

- `assistant.js` was `app/lib/booking/assistant.js` (talks to the extension)
- `BookingAssistant.jsx` was `app/components/BookingAssistant.jsx` (the block on /book)
- the /booking-assistant page is at git tag `booking-assistant-0.3.1`

Booking.com's CJ program terms ban browser extensions, so Booking.com/CJ links must
never be sent to the extension if it returns.
