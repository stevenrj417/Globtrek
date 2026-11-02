# GlobTrek audit (Phase 0)

Audited 2026-10-31 against `main` at `eb2a0f2`, which matched production at www.glob-trek.com.
Before screenshots of every route, quiz step and a results page at 375, 768, 1280 and 1440 px are in `audit/before/` (local only, not committed). Lighthouse JSON is in `audit/lighthouse/`.

Each item notes its status on the `household-name-upgrade` branch.

## Trust and accuracy

| Finding | Status |
|---|---|
| Contact page showed visitors "Product owner TODO: provide the public support email and responsible business identity." | Fixed. Owner TODO removed; email shown only when `CONTACT_EMAIL` is set. |
| Homepage trip prices ("Hanoi $700–$1,600") were hand-written and didn't match the app's own cost model ($510–$700 for 2 travelers, 5 nights). | Fixed. Every card uses `estimateTrip()`. |
| The "Lisbon" photo shows Porto (the Ribeira riverfront with rabelo boats). Used on the homepage, destination data and share images. | Fixed 2026-11-02 (with 7 other photos; see CHANGELOG). |
| The "Hanoi" photo is a generic modern skyline; its alt text says "a street scene". | Fixed 2026-11-02. |
| The quiz showed "We found it." before any matching had run. | Fixed. |
| The loading screen waited a fixed 3.9 s with a spinner, then results fetched the match again. | Fixed. Real work, 1.2–2.5 s, single fetch. |
| Results hero said "5 days" for a 5-night trip. | Fixed. |
| Ratings shown with no source; scale unstated. | Fixed. Source named only when known (Google), one format. |
| No affiliate disclosure near booking links on the results page. | Fixed. |
| Sign-in copy leaned on "secure"; a raw provider error could be shown. | Fixed. |
| Every cost model is flagged `baseline_requires_editorial_review`; 29 of 35 curated destinations use a price-tier default rather than city data, so very different places share one estimate (Tokyo = Paris = Patagonia). | Labeled honestly on destination pages. **Open: city cost models needed.** |

## Brand and navigation

| Finding | Status |
|---|---|
| Brand spelled six ways: GlobTrek (72), globtrek (44), Globtrek (21), Globtrēk (6), GLOBTREK (6), globTrek (5, code). Page title was "globtrek - One Tab Travel". | Fixed. "GlobTrek" in all copy; the lowercase "globtrek" logo wordmark kept (protected by tests). |
| Page titles mixed "X \| GlobTrek" and title case. | Fixed. "Page · GlobTrek" template, sentence case. |
| No Destinations page, Help page, robots.txt, manifest or OG image; `/help` and `/destinations` 404. | Fixed. |
| `/#trips` anchor worked but scrolled under nothing; header wasn't sticky. | Fixed. Sticky header, `scroll-mt` on the section. |
| Mobile nav was a second scrolling row; header CTA hidden on mobile. | Fixed. Menu sheet with focus trap; CTA in the sheet and hero. |

## Design system

| Finding | Status |
|---|---|
| ~25 one-off hex colors; gray text colors #888/#999 below WCAG AA. | Fixed. Color roles; 0 hard-coded hex in product components. |
| 132 text elements at 8–9 px, 111 at 10 px. | Fixed. 11 px floor (`text-micro`). |
| ~35 distinct letter-spacing values. | Fixed. 7 tracking tokens. |
| 7 different hand-written shadows. | Fixed. 3 shadow levels. |
| Duplicate `booking-return` keyframes in globals.css. | Fixed. |
| Scroll reveals ran even with reduced motion on. | Fixed. |
| 39 fluid `clamp()` headline sizes still written inline. | Open. Allowed by the spec for display/h1, but could be folded into named steps. |

## Missing states

| Finding | Status |
|---|---|
| No branded 404, error or offline state. | Fixed. |
| Email signup: no loading state, no inline validation, raw server error text. | Fixed. |
| Quiz lost all answers on refresh. | Fixed (sessionStorage, disclosed in Privacy). |
| Loading screen had no failure path. | Fixed. Retry when offline; local fallback otherwise. |

## Performance (local production builds, simulated mobile)

| Finding | Status |
|---|---|
| Header search bundled the full 300-destination catalog into every page. | Fixed. Loaded on demand. |
| Mobile LCP 6.1 s on home and quiz. | Improved to 3.4 s / 1.7 s. Home still below the 95 target (see CHANGELOG). |
