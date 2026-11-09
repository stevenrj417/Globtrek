# Security and privacy decisions

## Data

| Data | Where | Notes |
|---|---|---|
| Profile, party, groups, preferences | `chrome.storage.local` ("Save on this device") or `chrome.storage.session` ("Use once and forget") | Never in both; switching moves it. Sanitized on every write (`src/profile/sanitize.ts`). Not encrypted at rest (a key stored beside the data would add nothing); documented as "not a password manager". |
| Passports | off by default; `storage.session` (session only) or `storage.local` encrypted | AES-GCM-256, key from PBKDF2-SHA-256 (600k iterations, 16-byte salt), fresh 12-byte IV per write. Passphrase never stored; the key lives only in the assistant page's memory as a non-extractable `CryptoKey`, dropped after inactivity (default 10 min) or when the page closes. Typed into a page only after a per-page confirmation. Never in URLs, logs or messages to the website. |
| Trip checklists | `storage.local`, pruned after 14 days / 10 sessions | Destination, dates, party size, exact partner URLs, statuses. No traveler details. |
| Cards, CVV, bank logins, partner passwords, OTPs | **never** | `assertNoPaymentData` refuses card-shaped numbers (Luhn + network prefix) and credential-named keys on every profile write, export and fill. The engine skips `cc-*`, card/CVC-named, password, hidden and file inputs and never reads their values. |

No analytics, crash reporting or network requests exist in the extension; the build fails if `fetch(`, `eval(`, `new Function(`, `importScripts(`, `.innerHTML =` or a remote `<script src>` appears in the bundle. The only logger (`src/security/log.ts`) does nothing in production builds and redacts any non-token string in development.

## Website ↔ extension

- Bridge content script on `https://www.glob-trek.com/*` only (dev builds add localhost and `globtrek-potr-*.vercel.app`; both are compiled into dev builds only and still checked in code).
- Messages: `{ channel, v: 1, kind: "request", requestId, type }` with types `PING`, `START_SESSION`, `GET_STATUS`, `OPEN_SESSION`. Validation (`src/shared/schema.ts`) rejects unknown origins, unknown fields at every level, wrong versions, payloads over 16 KB, more than 12 items, bad dates, control characters, and any URL that isn't https on an allowlisted partner host (no credentials, ports or IP hosts; CJ links only when their `url` target is Booking.com; raw Booking.com refused so affiliate tracking can't be stripped).
- The website can't send code, selectors, HTML or commands; adapters are compiled into the package.
- A page may read or reopen only sessions its own origin started. The site receives statuses and generic notes, never details.

## Partner pages

- Fill script injected with `chrome.scripting.executeScript` into the top frame of a tab the assistant opened, only after the traveler clicks Fill (or opted into automatic fill for partners they allowed). It re-checks the hostname against the adapter's exact host list and the adapter policy before touching anything.
- Native value setter + `input`/`change`/`blur`; existing values are never overwritten; MutationObserver bounded by timeout and pass limit; cross-origin frames reported, never entered.
- No click, submit or navigation code exists in the engine. Terms checkboxes and radio buttons are never touched.

## Permissions (production)

| Permission | Why |
|---|---|
| `storage` | Keep the traveler's details (if they choose) and trip checklists on the device. |
| `scripting` | Inject the fill script into a partner's checkout tab after the traveler asks. |
| Content script on `https://www.glob-trek.com/*` | Let GlobTrek detect the extension, start a trip checklist and show booking statuses. |
| Optional host `https://www.getyourguide.com/*` | Fill contact details on GetYourGuide checkout. Requested at the moment of use, after an in-product explanation; removable in Privacy & data. |

Not requested: `<all_urls>`, `tabs`, `history`, `cookies`, `downloads`, `clipboardWrite`/`Read` (copy uses `navigator.clipboard` on a user click inside an extension page), `debugger`, `webRequest`, `alarms`, `sidePanel`. Optional hosts are generated from enabled adapters only (`tests/manifest.test.ts` enforces it), so disabled partners don't appear in the permission prompt.

## Chrome Web Store policy alignment

Limited Use statement on `/booking-assistant/privacy`; prominent disclosure in onboarding and before anything opens; data used only for the single purpose; affiliate program disclosed in listing, UI and landing page; affiliate links opened only on the traveler's click and never injected into pages they visit on their own; no remote code; unminified readable bundle.
