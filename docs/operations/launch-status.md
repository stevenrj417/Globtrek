# Public launch status (November 11, 2026)

## Verified
| Area | How |
| --- | --- |
| Matching: setting is a hard filter, incomplete destinations excluded, budget hard limit, deterministic order, versioned (`2026-11-11.1`) | `tests/launch-readiness.test.mjs` (12 checklist combinations, determinism, tie-breaks) |
| No-match: five options, each re-run through the matcher; "closest match anyway" labeled over budget | `tests/diagnose-no-match.test.mjs`, browser check |
| Catalog: 34 destinations eligible, 12 mountain destinations reviewed, 11 eligible (Kazbegi has no stays yet) | `node scripts/catalog/readiness-report.mjs` |
| Stable estimates: result id, frozen snapshot, "Refresh estimates" | unit tests, browser check |
| Flexible dates: one travel period for flights, stays and daily costs; booking links say "Check current prices" until exact dates | unit tests, browser check |
| Share links: encrypted, 90-day expiry; saved-trip links revocable | unit tests (seal/open/tamper/expiry) |
| Accounts: rename, duplicate, delete, export, delete account; every saved-trip query filters on the owner; RLS policies in migrations | code-level test; not tested against live auth |
| Security headers, per-IP rate limits, sign-in redirect allowlist, no-store on private pages | tests, header check on local production build |
| Accessibility: axe-core WCAG 2.2 AA on home, quiz, results, privacy (after fixing photo-credit target size) | Chromium, local production build |
| Phone width 375px: no horizontal scroll on home and results | Chromium emulation |
| Dependencies: `npm audit --omit=dev` 0 vulnerabilities (Next.js 16.4.6) | npm audit |

## Not done: needs a person or an account
- **Legal review** of Terms, Privacy and affiliate wording. Terms still lack governing law, notice address and dispute process (owner decision).
- **Independent penetration test.** Only automated and code-level checks were run.
- **Two-account manual isolation test** on production sign-in (create two accounts, confirm neither can see the other's trips or shares).
- **Safari, Firefox and real-device testing.** Only Chromium was available.
- **External user validation / beta testers.**
- **Uptime and error alerting** (see monitoring.md), and **spend alerts** for OpenAI, Google Maps Platform and Vercel.
- **Supabase backups:** confirm the plan includes restorable daily backups (see backup-and-restore.md).
- **Kazbegi:** no Booking.com stays in the CJ feed, so it stays out of recommendations.
- **Rate limits** are per server instance; enable Vercel Firewall rules for stronger protection.
- **Older share links** (`/results?trip=…`, before this release) are readable and don't expire.
