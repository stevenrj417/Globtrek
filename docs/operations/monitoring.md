# Monitoring

## In place
- **Health check:** `GET /api/health` returns 200 with `destinationsReady` and the matching algorithm version, 503 if the catalog can't load. No caching.
- **Server errors:** API routes log one JSON line per event (`level`, `msg`, `route`, timings). Vercel → Logs.
- **Browser errors:** `app/error.jsx` and `app/global-error.jsx` send crashes to `/api/client-error`, logged as `msg: "client_error"` (message, page path, digest; no user data).
- **Result feedback:** "Great match / Not for me / Something is wrong" on every result → `/api/feedback`, logged as `msg: "result_feedback"` with the result id, destination and algorithm version. Free text has emails and phone numbers removed.
- **Product analytics:** Vercel Web Analytics (cookieless). Events: `landing_viewed`, `quiz_started`, `quiz_step_completed`, `quiz_completed`, `result_viewed`, `hotel_card_viewed`, `outbound_click`, `email_signup`, `trip_shared`, `trip_adjusted`, `trip_adjust_undone`, `estimates_refreshed`, `result_feedback`, `no_match_fix`, `booking_item_opened`, `stay_partner_opened`. Properties pass through `sanitizeProperties()` (drops emails, phone numbers, long text).
- **Abuse limits:** per-IP limits on public APIs, logged as `rate_limited`.

## To set up (needs an account login, not done by code)
1. **Uptime alerts:** add an external monitor (Vercel's own, Better Stack, UptimeRobot, or Checkly) on `https://www.glob-trek.com/api/health`, every 1–5 minutes, alerting the team inbox.
2. **Error alerts:** in Vercel → Project → Settings → Log Drains or Notifications, alert on `level":"error"` spikes; or connect Sentry later.
3. **Spend alerts:** set usage limits/alerts for OpenAI, Google Maps Platform and Vercel.

## Weekly
- Read `result_feedback` lines; fix "Something is wrong" reports.
- Run `node scripts/catalog/readiness-report.mjs` to see eligible vs excluded destinations.
- Re-run the CJ feed import and places curation when data is older than the dates shown on result pages.
