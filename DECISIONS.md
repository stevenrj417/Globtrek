# Decisions

Choices made during the household-name upgrade, with the reason. When the spec was ambiguous, the more restrained, honest and consistent option won.

## Design system

- **Tokens over the spec's literal values where they would change the look.** The spec's tracking (−0.025 em display, +0.06–0.08 em caps) and radii (8/12/16) would visibly change a brand the owner likes. Tokens formalize the existing feel instead: four headline steps (−0.02 to −0.065 em), three caps steps (0.08 / 0.14 / 0.2 em), square corners. Everything still comes from one place (`app/globals.css`).
- **Square corners stay.** Cards, buttons and inputs are square across the site; `rounded-full` is kept only for circles (avatars, step markers). No radius tokens were introduced because none are used.
- **11 px type floor.** 8–10 px labels became 11 px (`text-micro`), 11–12 px became 12 px (`text-eyebrow`). Slightly larger, same character.
- **One accent.** The accent is the existing near-black. Brass (`#8a6b36`) stays as a small secondary highlight, never for actions.
- **Component classes live in `@layer components`** so Tailwind utilities (like `hidden`) can still override them.
- **No new dependencies.** Validation uses plain JS (`scripts/check-data.mjs`) instead of zod; the flag helper is ~30 lines.

## Trust

- **Estimates come from one function.** `estimateTrip()` builds on the existing budget engine. Categories are rounded to $10 first and totals are their sum, so the breakdown always adds up. Homepage and destination estimates assume 2 travelers, 5 nights (Mexico City 7), no dates (the engine's May default), before flights.
- **Cost model labels.** Every cost model is still `baseline_requires_editorial_review`. Pages say "cost model, dated August 2026", never "reviewed". Tier-default destinations say so explicitly.
- **Rating source.** Ratings name a source only when it's known: "Google" when the live Google Places match supplies the rating. Curated catalog ratings have no recorded source, so they're shown without one.
- **No Booking.com logo.** Brand-usage terms weren't in the repo, so Booking.com is named in text only.
- **"Why this fits you"** mentions only answers the trip's tags actually match, and mentions the budget only when the typical estimate is inside it.
- **Handoff.** Booking anchors keep their real affiliate `href` (middle-click, no-JS and blocked pop-ups still work). A normal click opens `/go` in a new tab, which shows partner, hotel, dates and travelers for 850 ms, then forwards. `/go` only forwards to Booking.com and CJ hosts.
- **Contact email is opt-in.** The domain sends from `hello@glob-trek.com`, but nothing confirms that inbox is monitored, so the page shows an address only when `CONTACT_EMAIL` is set, plus a reply time only if `CONTACT_REPLY_TIME` is set.
- **No cookie notice.** The site sets no non-essential cookies (auth cookies are essential; flag cookies only exist when a flag is turned on).
- **Neutral 404 heading.** "Good-value trips to start from", not "Trips people are planning", which would imply activity we can't show.

## Destination pages

- **Publishing threshold:** city, country, 3-letter airport, photo, editorial style, reviewed seasonal guidance (not the "requires editorial review" placeholder), a 12-month cost model and not flagged `recommendationReady: false`. Result: 35 of 300 published; 265 unlisted and absent from the sitemap. Unpublished slugs return 404 (`dynamicParams = false`).
- **Iceland Ring Road** gets no page: it belongs to the hidden Road Trips product.
- **"Know before you go"** shows only what the data has: everyday costs and monthly room prices from the cost model. Plug types, phrases, airport transfers and currency aren't in the data, so they aren't shown. Entry requirements and safety are links to the U.S. State Department, never stated as fact.
- **Vibe filters:** Coast, Mountains, Nature, City, History & culture. "Nature" is separate so safaris and jungles aren't labeled "Mountains".

## Product behavior

- **Quiz drafts** live in `sessionStorage` (this tab only), cleared on submit, disclosed in Privacy.
- **Loading screen** waits at least 1.2 s and at most 2.5 s. If the match fails while online, results still render from the local engine; only offline shows a retry.
- **Mobile header** has wordmark, search, sign in and a menu button. "Find my trip" lives in the menu sheet and hero on mobile because the row has no room for it next to the full wordmark.
- **Hidden products** (Road Trips, Cruises, the luxury inspiration strip) were left in place and still hidden.
- **Quiz images aren't preloaded** for the next step. The hover preview already renders every option image of the current step; preloading the optimized variants of the next step needs a loader change and was left out.

## Glossary

| Use | Not |
|---|---|
| trip | itinerary, plan, package |
| stays (section), hotel (a single property) | accommodations |
| estimate / est. | price (for anything not live) |
| GlobTrek | Globtrek, globTrek, GLOBTREK (logo wordmark is lowercase "globtrek") |
| Find my trip | Start your match |
| before flights / flights included | excl. airfare |
