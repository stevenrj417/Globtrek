# GlobTrek One Tab Booking Assistant (Chrome extension)

Manifest V3 extension that books a GlobTrek trip from one tab: it opens each booking GlobTrek selected, fills the traveler's own details where the partner allows it, tracks status, and stops before payment. Works with `www.glob-trek.com`'s booking checklist (`app/components/BookingChecklist.jsx` → `BookingAssistant.jsx`).

- Plan: [`docs/PLAN.md`](docs/PLAN.md)
- Partners, terms and field matrix: [`docs/PARTNERS.md`](docs/PARTNERS.md)
- Security and permissions: [`docs/SECURITY.md`](docs/SECURITY.md)
- Store listing, privacy answers, reviewer steps: [`store-assets/LISTING.md`](store-assets/LISTING.md)
- Release: [`docs/RELEASE.md`](docs/RELEASE.md)

## Layout

```
src/shared      message schema + validation, partner allowlist, statuses, build flags
src/profile     profile model, sanitizer, field resolution, local storage modes
src/security    payment/credential guard, passport vault (Web Crypto), safe logger
src/session     booking sessions and status mapping
src/adapters    Booking.com, GetYourGuide, OpenTable, GlobTrek flights (data only)
src/content     fill engine, injected fill script, glob-trek.com bridge
src/background  service worker: website requests, tabs, fills
src/ui          assistant page (onboarding, checklist, profile, privacy) and popup
static          HTML, CSS (GlobTrek tokens), icons
tests           node:test unit tests + sanitized fixtures (happy-dom)
scripts         build, manifest, package, fixture server, real-Chrome e2e
store-assets    store icon, screenshots, listing, ZIP output
```

## Commands (from the repo root)

| | |
|---|---|
| `npm run ext:install` | install the extension's dev tools (TypeScript, esbuild, happy-dom, puppeteer-core) |
| `npm run ext:typecheck` | strict TypeScript |
| `npm run ext:test` | unit + contract tests |
| `npm run ext:build` / `ext:build:dev` | `extension/dist/production` / `dist/development` |
| `npm run ext:fixtures` | sanitized fixture pages on http://localhost:4599 |
| `npm run ext:e2e` | real-Chrome end-to-end run (needs `npm run build` first; downloads nothing — install Chrome for Testing once with `npx @puppeteer/browsers install chrome@stable --path extension/.chrome`) |
| `npm run ext:package` | typecheck, test, production build, ZIP |

## Load unpacked

1. `npm run ext:build:dev` (or `ext:build` for production).
2. Chrome → `chrome://extensions` → turn on **Developer mode** → **Load unpacked** → choose `extension/dist/development` (or `dist/production`).
3. The development build also talks to `localhost:3010/3001/3000` and `globtrek-potr-*.vercel.app`, fills the local fixtures (run `npm run ext:fixtures`), and offers "Load fixture demo trip" on its Bookings screen.

Branded Chrome 137+ ignores the `--load-extension` command-line flag, so automated runs use Chrome for Testing; manual testing uses Load unpacked as above.
