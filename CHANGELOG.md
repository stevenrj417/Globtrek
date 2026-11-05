# Changelog

## Book everything with CJ tracking (2026-11-04)

- Every Booking.com link (hotels, flights, attractions) now leaves through GlobTrek's CJ click URL, enforced in one module (`app/lib/booking/cj.js`) and re-checked for the trip email and `/book`.
- Hotels without an exact Booking.com page fall back to a CJ Booking.com search for that hotel, pre-filled with dates and party; bare property links get dates and party added.
- Paid activities go to CJ Booking.com Attractions (exact page when known, otherwise a search for the activity in the trip's city). Free places keep their own page. Each keeps its official link.
- Dinners open the restaurant's own booking page; OpenTable gets the party size. CJ has no restaurant program in this account, so dinners carry no commission.
- New `/book` page ("Book everything"): one button opens every booking in its own tab; links travel in the URL and are re-validated. The trip email links to it at the top and bottom.
- Blocked-tab guidance on results and `/book` explains how to allow pop-ups so one click opens everything.

## Brand, contact and legal details (2026-11-02)

- Booking.com logo beside Booking.com mentions (owner-confirmed permission).
- Legal name GlobTrek in the footer, Privacy, Terms and Organization JSON-LD; Instagram (@globtrekonetabtravel) in the footer, Contact and JSON-LD `sameAs`.
- contact.globtrek.com@gmail.com shown in the footer, Contact, Privacy and Terms (via `CONTACT_EMAIL`).
- Removed two owner TODOs that were visible on the live Privacy and Terms pages.

## Photos, performance and accessibility follow-up (branch `photo-and-polish`, 2026-11-02)

- **Destination photos.** A contact-sheet review of all 35 published destinations found 5 wrong photos (Lisbon showed Porto, Costa Rica an African savanna, Barcelona Madrid, Amalfi a Greek island, Tahiti a US desert road), 1 broken (Florence returned 404) and 3 unidentifiable (Hanoi, Kyoto, Banff). All replaced with free Unsplash License photos whose pages name the location, each checked by eye. `npm run check:images` now fails if any published destination photo stops loading.
- **Performance.** Every page that linked to the quiz prefetched the worldwide airport list (twice, ~900 KB each uncompressed), blocking the main thread for 578 ms on the live homepage. It now loads only when the quiz's last step opens. Homepage weight 1,137 KB → 745 KB; local total blocking time 69–141 ms.
- **Accessibility.** axe-core (WCAG 2.2 AA) passes on all 11 public routes, quiz budget and final steps, building screen and results (local). Fixed: budget helper contrast (2.79:1), malformed cost-list `dl`, and buttons nesting photo-credit links. Keyboard checks pass: skip link, popover Escape, mobile menu focus trap and return focus, quiz arrow/Enter, destination filters.

Live Lighthouse before this follow-up (production, Lighthouse 13.6, mobile): home 75, quiz 84, destination 96, help 99; desktop 96–100; accessibility, best practices and SEO 100 everywhere.

Live Lighthouse after deploy (2026-11-02, production, mobile, two warm runs each): home 91 / 97, quiz 96 / 100, destination pages 95–98 (Lisbon 98, Paris 98, Hanoi 95); desktop 98–100. Accessibility, best practices and SEO 100 on every page. Total blocking time on the homepage fell from 578 ms to 74–81 ms. First runs right after a deploy score lower (Paris 79 cold, 98 warm) while Vercel's cache fills.

axe-core on production with real hotel data: results page, quiz steps and building screen pass, confirming the hotel thumbnail fix.

## Household-name upgrade (branch `household-name-upgrade`, 2026-10-31)

Same look, more finished. Nothing on the site claims trust; it shows its sources, adds up its numbers and never dead-ends. Details: `AUDIT.md` (what was wrong), `DECISIONS.md` (why), `COPY.md` (every string that changed).

### What changed

1. **Design tokens and one brand spelling.** Color roles, 11 px type floor, 7 tracking steps, 3 shadows and motion values in `app/globals.css`; 866 one-off values in components mapped onto them. "GlobTrek" everywhere in copy.
2. **Header, footer and global states.** Sticky header with scroll border, active page, mobile menu sheet with focus trap, skip link; grouped footer with auto year and nearby disclosure; branded 404, error, global error and offline states; title template, OG defaults, manifest, robots.txt, Organization JSON-LD; `track()` wrapper (no personal data) and off-by-default flags.
3. **Homepage.** One `estimateTrip()` function drives every price (tested to add up); What's included popover; how-it-works strip; budget facts from data; browse by vibe; why one trip; hero contrast scrim; email signup with real states.
4. **Quiz, loading, results.** Quiz keeps answers through refresh/back, number and arrow keys, progress bar, 250 ms auto-advance, vibe prefill. The loading screen runs the real match (1.2–2.5 s) and hands it to results. Results explain themselves honestly, show what the estimate covers, use one rating format, disclose commissions near hotel links, offer "Not quite right?", and hand off through `/go` with pre-filled dates and travelers.
5. **Help, Contact, How it works, About, legal.** New Help FAQ (FAQPage schema); Contact without the visible TODO; "How we pick trips"; tighter About; last-updated dates.
6. **Destinations.** `/destinations` index and 35 static destination pages with breadcrumbs, estimates, monthly room costs, official entry/advisory links, JSON-LD and OG images. `npm run check:data` validates all 300 records.
7. **Copy pass** and **performance**: header search and the estimate popover no longer ship the catalog or budget engine to every page.

### Lighthouse (performance / accessibility / best practices / SEO)

Local production builds of `main` and this branch, served with `next start`, Lighthouse 13.6, default mobile (slow 4G) and desktop presets. Vercel's CDN will do better on images; run again on the preview to confirm.

| Page | Before mobile | After mobile | Before desktop | After desktop |
|---|---|---|---|---|
| `/` | 77 / 96 / 96 / 100 · LCP 6.1 s | **92 / 100 / 96 / 100** · LCP 3.4 s | 95 / 96 / 96 / 100 | **100 / 100 / 96 / 100** |
| `/discover` | 78 / 95 / 96 / 100 · LCP 6.1 s | **99 / 100 / 96 / 100** · LCP 1.7 s | 98 / 95 / 96 / 100 | **100 / 100 / 96 / 100** |
| `/destinations/lisbon` | (new) | **95 / 100 / 96 / 100** · LCP 2.9 s | (new) | **100 / 100 / 96 / 100** |

CLS is 0.000 everywhere. Best Practices 96 is caused by two local-only items: the Vercel Analytics script 404s off Vercel, and production source maps aren't published.

Results page: not scored. It needs a quiz in localStorage, and locally it lacks the Supabase keys that only exist on Vercel.

### QA checklist

- [x] AUDIT.md, DECISIONS.md, COPY.md, CHANGELOG.md
- [x] Before/after screenshots, 80 each, every route and quiz step at 375/768/1280/1440 (`audit/before`, `audit/after`, local)
- [ ] Lighthouse targets: met on desktop everywhere and mobile `/discover` and destination pages; **mobile `/` is 92 vs 95** (hero photo on slow 4G)
- [x] Hard-coded values in product components: 0 hex colors, 0 px font sizes, 0 arbitrary tracking, 0 arbitrary shadows. 39 inline `clamp()` headline sizes remain (allowed for display/h1). Hidden Road Trips/Cruises and email HTML were not touched.
- [x] Brand spelled identically in copy
- [x] No nav item goes nowhere; `/help`, `/destinations` exist; unpublished destination slugs 404
- [x] No fabricated data added; ratings name a source only when known
- [x] Estimates add up (unit tests)
- [x] Affiliate links keep CJ tracking and pre-filled dates/travelers (tests); handoff never blocks the click and refuses non-partner URLs
- [x] Loading, empty, error and success states for signup, building screen, destination filters, 404/error, offline
- [x] Quiz survives refresh and back navigation (verified in a browser)
- [x] Reduced motion: scroll reveals and animations off
- [ ] Full keyboard-only and VoiceOver run-through: keyboard paths built and spot-checked, not a full manual pass
- [x] Road Trips and Cruises still hidden, code intact
- [x] `npm run build`, `npm run lint`, `npm test` (195 tests) and `npm run check:data` pass

### Left out, and why

- **Booking.com catalog feed shapes** (free cancellation, breakfast badges, "Prices checked 3 hours ago"): the feed isn't connected yet, so there's no real data to show. Components hide missing fields, so the badges can be added when the feed lands.
- **Contact form:** no monitored inbox is confirmed, so a form would be a dead end.
- **Know-before-you-go fields** beyond costs (plugs, phrases, transfers, weather): not in the data. Hidden, not invented.
- **Next-step image preloading in the quiz:** see DECISIONS.md.
- **Lighthouse on the Vercel preview:** previews require Vercel sign-in.

### Needs the owner

1. ~~Replace the Lisbon photo~~ Done 2026-11-02.
2. ~~Contact address~~ contact.globtrek.com@gmail.com (2026-11-02). Optional: a reply-time promise via `CONTACT_REPLY_TIME`.
3. ~~Legal name~~ GlobTrek. Still needed: governing law, notice address and dispute process for Terms and Privacy.
4. ~~Booking.com logo~~ Done.
5. ~~Social accounts~~ Instagram linked.
6. City-specific cost models for the 29 destinations using price-tier defaults.
7. Editorial review of seasonal guidance to publish more of the 264 unpublished destinations.
