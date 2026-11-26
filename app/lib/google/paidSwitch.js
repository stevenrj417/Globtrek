// Master switch for every paid Google Maps Platform call (Places, Routes, the
// Maps JavaScript map). Off since 2026-11-25 at the owner's request: GlobTrek
// should not pay for APIs. Features fall back to GlobTrek's own data (airport
// list, Booking.com catalog, Wikimedia photos, OpenStreetMap) or hide.
// Tests that inject their own fetch still run the Google code paths.
export const GOOGLE_PAID_APIS_ENABLED = false;

export function googleBlocked(fetchImpl) {
  return !GOOGLE_PAID_APIS_ENABLED && (fetchImpl === undefined || fetchImpl === globalThis.fetch);
}
