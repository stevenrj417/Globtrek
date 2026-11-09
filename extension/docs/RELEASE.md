# Versioning and release

- **Version** lives in `extension/package.json` and is written into `manifest.json` at build time. Semantic versioning: patch for selector updates and copy fixes, minor for new fields or partners, major for changes to stored data or the website protocol. Chrome requires every upload to have a higher version.
- **Protocol** (`PROTOCOL_VERSION` in `src/shared/schema.ts`, `ASSISTANT_PROTOCOL` in `app/lib/booking/assistant.js`) changes only with a compatible website release; `tests/contract.test.ts` keeps the two sides in step.
- **Selectors**: bump the adapter's `selectorsVersion` with any selector change.

## Release steps

1. Re-read partner terms (`docs/PARTNERS.md`) and the Chrome Web Store policies; update the review date.
2. For each enabled adapter, open a real checkout as a traveler would and confirm every selector; update fixtures if markup changed.
3. Bump `version` in `extension/package.json`; add a CHANGELOG entry.
4. From the repo root: `npm run ext:install` (first time), then `npm run ext:package` — typecheck, unit tests, production build and ZIP in `extension/store-assets/`.
5. `npm run build && npm run ext:build:dev && npm run ext:e2e` — real-Chrome end-to-end checks; refreshes screenshots.
6. Load `extension/dist/production` unpacked in your own Chrome (chrome://extensions → Developer mode → Load unpacked) and click through the reviewer instructions in `store-assets/LISTING.md`.
7. Upload the ZIP in the Chrome Web Store Developer Dashboard, paste the listing text, privacy answers and permission justifications, attach the icon and screenshots, and submit for review. (Manual; not automated.)
8. After approval, set `NEXT_PUBLIC_GLOBTREK_EXTENSION_URL` in Vercel to the listing URL so "Add to Chrome" and `/booking-assistant` link to it, and deploy the site.
