# Master destination list

`scripts/destinations/globtrek_destination_master_list.xlsx` is the canonical list of quiz outcomes: 237 places (26 US, 211 international, 42 hidden gems) and 2,229 lodging price rows.

- **Outcome ID** (`GT-0001`…) is the permanent key.
- **Exact Match** is the quiz-result string. It is looked up exactly with `destinationByExactMatch()` in `app/data/destinations.js`: no trimming, case folding or fuzzy matching.

## Files

| File | What it is | Where it is used |
| --- | --- | --- |
| `app/data/destinationOutcomes.json` | Every outcome with its workbook fields and the catalog destination it links to | Server and tests |
| `app/data/destinationOutcomeIndex.json` | Small map: destination id → outcome ID, Exact Match, type, scope | Browser (via `destinations.js`) |
| `app/data/lodgingPriceGuide.json` | All 2,229 lodging rows | Server only; never import it in a `"use client"` file (a test checks this) |
| `app/data/lodgingPriceBands.json` | Per destination: dorm, budget hotel, three-star, four-star, luxury and campsite averages, plus how many places share the band | Browser |
| `scripts/destinations/verified-batch-05.json` | The 101 outcomes that weren't in the catalog before, verified against Wikipedia and Wikimedia Commons | Catalog |
| `scripts/destinations/master-list-links.json` | Hand-reviewed outcome → destination links where name matching is wrong or misses | Import |
| `scripts/destinations/master-list-report.json` | Last import's counts and problems | Import |
| `scripts/destinations/master-list-progress.json` | Resumable status for every outcome against the spec | Status script |

## Re-importing after the workbook changes

1. Replace the workbook in `scripts/destinations/`.
2. Run `node scripts/destinations/import-master-list.mjs`. It validates every row: required columns, ID format, duplicate IDs or Exact Match strings, lodging rows tied to outcomes, and low ≤ average ≤ high. It stops on any problem and lists them in `master-list-report.json`. Nothing is written until the whole file passes.
3. For new outcomes that aren't in the catalog (`notInCatalogYet` in the report):
   1. Add each one to `PLACES` in `scripts/destinations/build-seed-batch-05.mjs`, giving its Wikipedia title, airport, knownness and tags.
   2. Run `node scripts/destinations/build-seed-batch-05.mjs`.
   3. Run `node scripts/destinations/verify-wikimedia.mjs scripts/destinations/seed-batch-05.json scripts/destinations/verified-batch-05.json --delay 400`. Add `--resume` to retry only the failures.
4. Look at every new hero photo. Replace flags, maps, satellite views, collages, `.tif` files and anything under about 1,600 px:
   1. Add the replacement to `MASTER_LIST_REPLACEMENTS` in `scripts/destinations/replace-hero-images.mjs` and run it. It records the author, license and source page from Commons.
   2. Add alt text in `app/data/imageAlts.js`.
5. Run the import again so new records link by their own Outcome ID.
6. Refresh the data, step by step:
   1. `node scripts/destinations/enrich-wikidata.mjs`, then `node scripts/destinations/fetch-climate.mjs`, then `node scripts/destinations/build-destination-facts.mjs`. These use Wikipedia, Wikidata and NASA POWER, which are free and need no key.
   2. `node scripts/pricing/collect-meal-prices.mjs --destinations id,id`, then `node scripts/pricing/build-destination-costs.mjs`. These use Google Places and need `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
   3. `node scripts/activities/curate-places.mjs --destinations id,id`. This also uses Google Places.
   4. `npm run stays:import -- --snapshot --all --destinations id,id`. This uses the CJ Booking.com feed and needs `CJ_API_TOKEN`, `CJ_COMPANY_ID` and `CJ_PID`. Add `--supabase` with `SUPABASE_SERVICE_ROLE_KEY` to load the database too. The site falls back to the bundled snapshot per destination.
   5. `node scripts/destinations/build-image-widths.mjs`.
7. Run `node scripts/destinations/master-list-status.mjs` and `node scripts/catalog/quiz-reachability.mjs`.

## How the lodging prices are used

The workbook's prices are regional bands: 237 places share 37 distinct rows, so Edinburgh, the Westfjords and Vieques have identical numbers. They are planning estimates, not per-destination research. That is why they come last:

1. An editorial city budget.
2. Lodging modeled from observed local prices (`local_prices`).
3. The workbook band (`price_band`), only when local meal prices were observed. Without those it is `price_band_partial`, which is not quiz-ready.
4. A price-tier default.

Resort economies (the Maldives, Seychelles, Maui, Tahiti, Bora Bora and St. Barts) never use a band, because their band is far below what their resorts charge. Results show the band as "Typical nightly price, averaged over a year… A planning estimate for places like this, not a quote."

## What the list can't supply yet

- **Per-property hotel prices, ratings and photos** need Booking Demand API access (`BOOKING_DEMAND_API_TOKEN`, `BOOKING_AFFILIATE_ID`). Stays shown now come from the CJ Booking.com feed: real properties, but not live availability.
- **Live fares.** Flights are observed Aviasales prices through Travelpayouts (`TRAVELPAYOUTS_TOKEN`, server-side), labeled as observed fares. Airports with no observations use the distance model, labeled as an estimate. Collection works per origin, so remote airports may never appear.
- **Restaurants** come only from Google Places results that are operating and have enough reviews. None are written by hand.
