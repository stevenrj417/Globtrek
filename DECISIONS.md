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
- **Booking.com logo.** The owner confirmed permission on 2026-11-02. The official wordmark (`public/partners/booking-com.svg`, from Wikimedia Commons) appears small and only beside a mention of Booking.com: homepage step 3, the results disclosure and the hand-off page.
- **"Why this fits you"** mentions only answers the trip's tags actually match, and mentions the budget only when the typical estimate is inside it.
- **Handoff.** Booking anchors keep their real affiliate `href` (middle-click, no-JS and blocked pop-ups still work). A normal click opens `/go` in a new tab, which shows partner, hotel, dates and travelers for 850 ms, then forwards. `/go` only forwards to Booking.com and CJ hosts.
- **Contact address is contact.globtrek.com@gmail.com** (owner's choice, 2026-11-02), set via `CONTACT_EMAIL` in Vercel. The owner first asked for contact.globtrek@globtrek.com, but globtrek.com belongs to an unrelated company with its own mail server. contact@glob-trek.com is possible later once a Porkbun email forward is confirmed; Vercel doesn't forward email.
- **Contact email is opt-in.** The domain sends from `hello@glob-trek.com`, but nothing confirms that inbox is monitored, so the page shows an address only when `CONTACT_EMAIL` is set, plus a reply time only if `CONTACT_REPLY_TIME` is set.
- **No cookie notice.** The site sets no non-essential cookies (auth cookies are essential; flag cookies only exist when a flag is turned on).
- **Neutral 404 heading.** "Good-value trips to start from", not "Trips people are planning", which would imply activity we can't show.

- **Legal name** is GlobTrek. Privacy and Terms say who operates the site and that it is based in Oregon, United States (owner, 2026-11-02); governing law, notice address and dispute process are left out until the owner supplies them, rather than shown as a TODO.

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

## Budget-first update (2026-11-04)

- **Budget cities.** 19 verified catalog cities (Las Vegas, Honolulu, San Diego, Palm Springs, Los Angeles, San Francisco, Seattle, Chicago, Austin, New Orleans, Nashville, Miami, Orlando, Santa Fe, Anchorage, Guadalajara, Oaxaca, Mérida, Puerto Vallarta) get a budget editorial layer in `app/data/budgetDestinations.js`: room for two, food, activities, transit, airport transfer and lodging tax. Their old tier costs ($320–900 a night for Honolulu, LA and Puerto Vallarta) made budget trips impossible.
- **Researched Portland fares** (`ROUTE_OVERRIDES` in `travelFeasibility.js`), November 2026 public snapshots: LAS $160–350 ([Orbitz](https://www.orbitz.com/es/lp/vuelos/pdx/las/portland-a-las-vegas), [Cheapflights](https://www.cheapflights.ca/flights-to-Las-Vegas/Portland-OR/), [FareCompare](https://www.farecompare.com/flights/Portland-PDX/Las_Vegas-LAS/market.html)); HNL $350–450 ([American](https://www.aa.com/en-us/flights-from-portland-to-honolulu), [United](https://www.united.com/en-us/flights-from-portland-or-to-honolulu)); LAX/BUR/SAN/PSP/PHX $106–200 ([Kayak](https://www.kayak.com/flight-routes/Portland-PDX/California-USCA), [Alaska](https://www.alaskaair.com/en/flights-from-portland)); MEX $255–365 ([Travelocity](https://www.travelocity.com/lp/flight-routes/frontier-airlines-from-portland-intl-to-mexico-city-intl/f9/pdx/mex)). Other origins still use the distance model.
- **Lodging benchmarks:** Las Vegas motels $50–65 ([Vegas Food & Fun](https://vegasfoodandfun.com/cheap-motels-in-las-vegas/), [Momondo](https://global.momondo.com/hotels/las-vegas/Motel-6-Las-Vegas---I-15.mhd114983.ksp)); Waikiki hostels $39–46 a bed, budget hotels ~$102 ([HotelsCombined](https://www.hotelscombined.in/Hotel/Waikiki_Beachside_Hostel.htm), [GetCostIdea](https://getcostidea.com/?p=17801)). Other cities' budget values are GlobTrek editorial estimates; lodging tax rates are approximate.
- **Budget modes:** "cheapest" plans around the deal fare, rooms −15%, food −20%, activities −50%; "comfortable" rooms +30%, food +20%. Default is best value.
- **True total** now includes lodging tax on the room rate and round-trip airport transfers per traveler.
- **Home city is never recommended** (Portland is in the catalog).
- **No dead ends.** The results page explains which constraint failed and offers only fixes that were re-run through the matcher.
- **No "GlobTrek × Booking.com" lockup.** GlobTrek is a CJ affiliate; a co-branded partnership mark needs Booking.com's written approval. The logo appears beside "Book on Booking.com"-style lines instead.
- **Not built yet (needs live flight data, e.g. Duffel):** baggage totals, layover/self-transfer/airport-change warnings, nearby-airport price comparison, flexible-date savings and price alerts. Today's warning covers arrival airports 15+ miles from the city center.

## Pre-filled bookings and real fares (2026-11-08)

- **Personal and payment details never go in links.** Partner deep links carry trip details only (dates, guests, rooms, route, currency). Putting names, emails, phones or cards in URLs would leak them into history, logs and analytics. Booking.com fills saved details for signed-in travelers, so the booking flow asks them to sign in first.
- **Flight fares** come from the Travelpayouts Aviasales Data API (`grouped_prices`, market `us`, USD): cached fares travelers found in the last 48 hours, kept up to 7 days. They are averaged into two-week windows and refreshed by script; they are not live quotes. Flight booking links stay on Booking.com Flights through CJ.
- **Exact hotel prices** need Booking.com's Demand API (gated). Travelpayouts' hotel API is granted case by case. Hotel prices stay labeled as estimates until one of those is approved.
- **DOT fares over Travelpayouts for now.** The owner has no Travelpayouts access. The U.S. DOT Consumer Airfare Report is official, free and needs no account: average one-way fares actually paid (taxes included) per quarter, plus the lowest-fare airline's average. Modes: cheapest = 2 × lowest-fare airline average, comfortable = 2 × all-airline average, best value = the midpoint. It's quarterly, not two-weekly, and covers the 48 contiguous states only. Refresh with `npm run flights:dot` each quarter.
