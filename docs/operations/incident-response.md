# Incident response

## 1. Confirm
- Open https://www.glob-trek.com/api/health. `ok: true` with a non-zero `destinationsReady` means the app and catalog load.
- Try the core path yourself: home → **Find my trip** → finish the quiz → results load with a destination, estimate and booking checklist.
- Vercel dashboard → `globtrek-potr` → **Logs**. Filter by `level":"error"`. Useful messages: `match_failed`, `client_error`, `share_seal_failed`, `account_delete_failed`, `rate_limited`.

## 2. Decide severity
| Severity | Examples | Response |
| --- | --- | --- |
| SEV1 | Site down, results never load, wrong-person data shown, a secret exposed | Roll back now (see rollback.md), then investigate |
| SEV2 | One feature broken (sharing, accounts, a partner link), wrong prices across many trips | Fix forward within a day or roll back |
| SEV3 | One destination's data wrong, a cosmetic bug | Normal fix |

## 3. Act
- **Bad deploy:** roll back (rollback.md). Rolling back is always safe; GlobTrek keeps no server state that a deploy migrates.
- **A destination's data is wrong:** remove it from recommendations by deleting a required field, or add a failing check in `app/lib/recommendation/eligibility.js`, then deploy. `node scripts/catalog/readiness-report.mjs` shows what is eligible.
- **A partner link is wrong:** the booking checklist and stay cards build links in `app/lib/booking/` and `app/data/destinations.js`.
- **OpenAI is down or slow:** nothing to do. `/api/match` falls back to the built-in plan and the destination is unaffected.
- **Abuse / traffic spike:** per-IP limits answer 429 (`app/lib/security/rateLimit.js`, per server instance). For a real attack turn on Vercel Firewall / Attack Challenge Mode in the dashboard.
- **Exposed secret:** rotate it at the provider (OpenAI, Supabase, CJ, Google, Resend, Travelpayouts), update it in Vercel env vars, redeploy. Rotating `CRON_SECRET` (or setting `SHARE_TOKEN_SECRET`) invalidates all anonymous share links.
- **Data exposure involving another person's data:** treat as SEV1. Roll back, then document what was exposed, to whom and when. Notification duties depend on the data and the states involved; get legal advice.

## 4. Afterwards
Write down what happened, when it started and ended, the impact, the fix and one change that prevents a repeat. Add a test for it.
