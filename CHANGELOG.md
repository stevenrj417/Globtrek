# Changelog

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

1. Replace the Lisbon photo (it's Porto) and check the Hanoi photo.
2. Confirm a monitored contact address (and reply time), then set `CONTACT_EMAIL` / `CONTACT_REPLY_TIME` in Vercel.
3. Legal business name for the footer.
4. Booking.com logo usage rights (text-only for now).
5. Which social accounts exist (none linked for now).
6. City-specific cost models for the 29 destinations using price-tier defaults.
7. Editorial review of seasonal guidance to publish more of the 264 unpublished destinations.
