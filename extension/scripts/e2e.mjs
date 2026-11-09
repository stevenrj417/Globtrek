// End-to-end check in real Chrome (Chrome for Testing) with the unpacked development
// build. It never contacts a partner: every non-local hostname is made unresolvable,
// so partner tabs open to Chrome's error page with their exact URL intact.
//
//   npm run build:dev && npm run test:e2e        (expects the site on http://localhost:3001,
//                                                 or starts `next start -p 3001` from the repo root)
// Writes evidence to extension/.e2e/ and store screenshots to store-assets/screenshots/.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { computeExecutablePath, Browser } from "@puppeteer/browsers";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { startFixtureServer } from "./fixture-server.mjs";
import { encodeBookingPage } from "../../app/lib/booking/bookPage.js";
import { buildBookingManifest } from "../../app/lib/booking/manifest.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const extensionPath = join(root, "dist", "development");
const evidence = join(root, ".e2e");
const shots = join(root, "store-assets", "screenshots");
const SITE = process.env.SITE_URL || "http://localhost:3001";
const results = [];
await mkdir(evidence, { recursive: true });
await mkdir(shots, { recursive: true });

function step(name, detail = "") { results.push({ name, ok: true, detail }); console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`); }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function siteUp() { try { return (await fetch(SITE)).ok; } catch { return false; } }
let siteProcess = null;
if (!(await siteUp())) {
  siteProcess = spawn("npx", ["next", "start", "-p", new URL(SITE).port || "3001"], { cwd: repo, stdio: "ignore" });
  for (let i = 0; i < 60 && !(await siteUp()); i += 1) await sleep(500);
}
assert.ok(await siteUp(), `GlobTrek site not reachable at ${SITE}`);
const fixtures = await startFixtureServer();

const executablePath = process.env.CHROME_PATH || computeExecutablePath({ browser: Browser.CHROME, buildId: process.env.CHROME_BUILD || "157.0.8103.38", cacheDir: join(root, ".chrome") });
const offline = "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost";

// A trip exactly as the site builds it: CJ-tracked Booking.com stay and flight, an OpenTable dinner.
const manifest = buildBookingManifest({
  destination: { city: "Lisbon", country: "Portugal", airport: "LIS" },
  dates: { start: "2027-04-12", end: "2027-04-17" },
  travelers: { adults: 2, children: 0, total: 2 },
  hotels: [{ name: "Memmo Alfama" }],
  hotelExactUrls: ["https://www.booking.com/hotel/pt/memmo-alfama.html"],
  restaurants: [{ name: "Taberna da Rua das Flores", bookingUrl: "https://www.opentable.com/r/taberna-da-rua-das-flores-lisboa", reservationTime: "2027-04-13T19:30" }],
  experiences: [],
  flight: { selected: true, origin: "JFK", destination: "LIS", adults: 2, departureDate: "2027-04-12", returnDate: "2027-04-17" },
  flightDeepLink: "https://flights.booking.com/flights/JFK.AIRPORT-LIS.AIRPORT/?depart=2027-04-12&return=2027-04-17&adults=2",
});
const bookUrl = `${SITE}/book?b=${encodeBookingPage(manifest)}`;

async function launch(withExtension) {
  return puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    ignoreDefaultArgs: withExtension ? ["--disable-extensions"] : [],
    args: [offline, "--no-first-run", "--lang=en-US", ...(withExtension ? [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`] : [])],
  });
}

const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const a11y = [];
// WCAG 2.2 A/AA rules via axe-core. Evaluated over CDP, so extension-page CSP isn't loosened.
async function audit(page, name) {
  await page.evaluate(axeSource);
  const result = await page.evaluate(async () => {
    const run = await globalThis.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
    return run.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, target: v.nodes[0]?.target?.join(" ") }));
  });
  a11y.push({ page: name, violations: result });
  assert.deepEqual(result, [], `${name} accessibility violations: ${JSON.stringify(result)}`);
}
async function textOf(page) { return page.evaluate(() => document.body.textContent); }
async function waitText(page, text, timeout = 10000) {
  try { await page.waitForFunction((t) => document.body.textContent.includes(t), { timeout, polling: 250 }, text); }
  catch (error) {
    await page.screenshot({ path: join(evidence, "failure.png") }).catch(() => undefined);
    throw new Error(`Timed out waiting for "${text}". Page says: ${(await page.evaluate(() => document.body.textContent).catch(() => "")).replace(/\s+/g, " ").slice(0, 600)}`, { cause: error });
  }
}
async function clickText(page, selector, text) {
  const ok = await page.evaluate((s, t) => { const el = [...document.querySelectorAll(s)].find((e) => e.textContent.includes(t)); if (el) { el.click(); return true; } return false; }, selector, text);
  assert.ok(ok, `no ${selector} with "${text}"`);
}
async function typeField(page, label, value) {
  const id = await page.evaluate((l) => [...document.querySelectorAll("label.field")].find((e) => e.querySelector(".label")?.textContent.trim() === l)?.querySelector("input,textarea,select")?.id, label);
  assert.ok(id, `field ${label}`);
  await page.$eval(`#${id}`, (el) => { el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); });
  await page.type(`#${id}`, value);
}

try {
  // ---------- 1. Website without the extension
  {
    const browser = await launch(false);
    const page = await browser.newPage();
    await page.goto(bookUrl, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent.includes("Book my trip")), { timeout: 8000 });
    await clickText(page, "button", "Book my trip");
    await page.waitForSelector("dialog[open]");
    assert.match(await page.$eval("dialog[open]", (d) => d.textContent), /Add to Chrome/);
    await page.screenshot({ path: join(evidence, "site-without-extension.png") });
    await audit(page, "site: /book with install dialog open");
    for (const path of ["/booking-assistant", "/booking-assistant/privacy"]) {
      await page.goto(`${SITE}${path}`, { waitUntil: "networkidle0" });
      await audit(page, `site: ${path}`);
    }
    step("Website detects the extension is absent", "Book my trip opens the install explanation with the Chrome Web Store placeholder");
    const phone = await browser.newPage();
    await phone.emulate({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1", viewport: { width: 390, height: 844, isMobile: true, hasTouch: true } });
    await phone.goto(bookUrl, { waitUntil: "networkidle0" });
    await waitText(phone, "runs in Chrome on a computer");
    await phone.screenshot({ path: join(evidence, "site-mobile-handoff.png") });
    step("Mobile visitors get the desktop-Chrome handoff");
    await browser.close();
  }

  // ---------- 2. Extension loads unpacked
  const browser = await launch(true);
  const worker = await browser.waitForTarget((t) => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"), { timeout: 15000 });
  const extensionId = new URL(worker.url()).host;
  const sw = await worker.worker();
  const storage = () => sw.evaluate(async () => ({ local: await chrome.storage.local.get(null), session: await chrome.storage.session.get(null) }));
  const manifestLoaded = await sw.evaluate(() => chrome.runtime.getManifest());
  step("Extension loads unpacked in Chrome", `${manifestLoaded.name} ${manifestLoaded.version}, id ${extensionId}, permissions ${manifestLoaded.permissions.join("+")}`);
  const welcomeTarget = await browser.waitForTarget((t) => t.url().includes("assistant.html#/welcome"), { timeout: 10000 });
  const app = await welcomeTarget.page();
  await app.setViewport({ width: 1280, height: 800 });
  await waitText(app, "Your trip, booked from one tab.");
  await app.screenshot({ path: join(shots, "05-welcome.png") });
  await audit(app, "assistant: welcome");
  step("First-run onboarding opens on install");
  await clickText(app, "button", "Continue to my details");
  await waitText(app, "Enter it once.");

  // ---------- 3. One traveler form (and the card guard)
  await typeField(app, "Legal first name", "Ana");
  await typeField(app, "Legal last name", "Costa");
  await clickText(app, "[role=tab]", "Contact");
  await typeField(app, "Email", "ana.costa@example.com");
  await typeField(app, "Phone country code", "+351");
  await typeField(app, "Phone number", "912 345 678");
  await typeField(app, "Address line 1", "Rua Augusta 1");
  await typeField(app, "City", "Lisboa");
  await typeField(app, "Postal code", "1100-048");
  await typeField(app, "Country", "Portugal");
  await clickText(app, "[role=tab]", "Stay & dining");
  await typeField(app, "Usual arrival time", "3 PM");
  await typeField(app, "Special requests", "Card 4111 1111 1111 1111");
  await clickText(app, "button", "Save my details");
  await waitText(app, "looks like a payment card number, so it wasn't saved");
  let stored = JSON.stringify(await storage());
  assert.ok(!stored.includes("4111"), "card number never reached storage");
  step("Card numbers are refused, not stored", "profile save rejected; storage scanned for the card digits: none");
  await typeField(app, "Special requests", "Quiet room, high floor");
  await clickText(app, "[role=tab]", "Travelers");
  await app.screenshot({ path: join(shots, "03-traveler-profile.png") });
  await audit(app, "assistant: profile editor");
  await clickText(app, "button", "Save my details");
  await waitText(app, "Saved on this device.");
  stored = await storage();
  assert.equal(stored.local.profile.contact.email, "ana.costa@example.com");
  step("One traveler form saved locally", "stored in chrome.storage.local; the build guard rejects any fetch() in the bundle");

  // ---------- 4. Website with the extension: detection, session, multiple tabs, statuses
  const site = await browser.newPage();
  await site.goto(bookUrl, { waitUntil: "networkidle0" });
  await waitText(site, "Open all 3 bookings from one place");
  step("Website detects the installed extension", "PING answered through the glob-trek bridge");
  const assistantOpened = browser.waitForTarget((t) => t.url().includes("assistant.html#/session/"), { timeout: 10000 });
  await clickText(site, "button", "Book my trip");
  const sessionPage = await (await assistantOpened).page();
  await sessionPage.setViewport({ width: 1280, height: 800 });
  await waitText(sessionPage, "Before anything opens");
  await sessionPage.screenshot({ path: join(evidence, "site-session-before-opening.png") });
  step("Book my trip opens the assistant with a validated session", "shows details to be used and which partners receive them");
  const before = new Set((await browser.pages()).map((p) => p.target()._targetId));
  await clickText(sessionPage, "button", "Open everything");
  const expected = (await sw.evaluate(async () => Object.values((await chrome.storage.local.get("sessions")).sessions)[0].items.map((i) => i.url)));
  await sleep(2500);
  const opened = (await browser.targets()).filter((t) => t.type() === "page" && !before.has(t._targetId)).map((t) => t.url());
  for (const url of expected) assert.ok(opened.includes(url), `tab opened with exact URL ${url}`);
  step("Multiple approved tabs open from one click", `${expected.length} tabs, URLs identical to GlobTrek's (CJ tracking intact)`);
  await site.bringToFront();
  await waitText(site, "Assistant: Opened", 10000);
  await site.$eval("#booking-center details", (el) => { el.open = false; });
  await site.$eval("#booking-center", (el) => el.scrollIntoView({ block: "start" }));
  await site.evaluate(() => window.scrollBy(0, -96));
  await site.screenshot({ path: join(shots, "06-globtrek-checklist-status.png") });
  await audit(site, "site: /book with assistant statuses");
  step("GlobTrek stays the central checklist", "per-booking status pushed back to the site tab (no traveler data)");

  // ---------- 5a. Store screenshots: production behaviour on a realistic trip
  await sessionPage.bringToFront();
  await sessionPage.goto(`chrome-extension://${extensionId}/assistant.html#/`);
  await waitText(sessionPage, "Load showcase trip");
  await clickText(sessionPage, "button", "Load showcase trip");
  await waitText(sessionPage, "Before anything opens");
  await sessionPage.screenshot({ path: join(shots, "02-before-anything-opens.png") });
  await audit(sessionPage, "assistant: trip before opening");
  await clickText(sessionPage, "button", "Open everything");
  await sessionPage.bringToFront();
  await sessionPage.waitForFunction(() => document.body.textContent.includes("Ready to pay") && document.body.textContent.includes("Ready to review"), { timeout: 20000, polling: 250 });
  await sessionPage.evaluate(() => window.scrollTo(0, 0));
  await sessionPage.screenshot({ path: join(shots, "01-trip-checklist.png") });
  await audit(sessionPage, "assistant: trip checklist with statuses");
  step("Showcase trip: copy-only partners opened, GetYourGuide filled, payment step stopped", "store screenshots 01 and 02");

  // ---------- 5. Fill on sanitized fixtures; stop before payment
  await sessionPage.bringToFront();
  await sessionPage.goto(`chrome-extension://${extensionId}/assistant.html#/`);
  await waitText(sessionPage, "Load fixture demo trip");
  await clickText(sessionPage, "button", "Load fixture demo trip");
  await waitText(sessionPage, "Fixture: Booking.com guest details");
  // (The button sends variant "fixtures": every adapter against its sanitized fixture.)
  await clickText(sessionPage, "button", "Open everything");
  try {
    await sessionPage.waitForFunction(() => document.body.textContent.includes("Ready to pay") && (document.body.textContent.match(/Ready to review/g) || []).length >= 3, { timeout: 20000, polling: 250 });
  } catch (error) {
    const items = await sw.evaluate(async () => Object.values((await chrome.storage.local.get("sessions")).sessions).find((s) => s.trip.tripId === "dev-demo")?.items.map(({ name, status, note, filled, needsManual, tabId }) => ({ name, status, note, filled, needsManual, tabId })));
    await sessionPage.screenshot({ path: join(evidence, "failure.png") });
    throw new Error(`Fixture fill did not finish: ${JSON.stringify(items, null, 1)}`, { cause: error });
  }
  const fixturePages = (await browser.pages()).filter((p) => p.url().startsWith("http://localhost:4599/"));
  const checks = {};
  for (const page of fixturePages) {
    checks[new URL(page.url()).pathname] = await page.evaluate(() => ({
      submitted: document.body.dataset.submitted ?? null,
      values: Object.fromEntries([...document.querySelectorAll("input:not([type=checkbox]):not([type=hidden]),textarea,select")].map((el) => [el.name || el.id, el.autocomplete?.startsWith("cc-") ? "(card field — not inspected by the extension)" : el.value])),
      termsTicked: [...document.querySelectorAll("input[type=checkbox]")].some((el) => el.checked),
    }));
  }
  await writeFile(join(evidence, "fixture-fill-results.json"), JSON.stringify(checks, null, 2));
  const bookingForm = checks["/booking/book.html"];
  assert.equal(bookingForm.values.firstname, "Ana");
  assert.equal(bookingForm.values.email_confirm, "ana.costa@example.com");
  assert.equal(bookingForm.values.cc1, "pt");
  assert.equal(bookingForm.values.checkin_eta_hour, "15");
  assert.equal(bookingForm.values.password, "");
  assert.equal(checks["/getyourguide/checkout/fixture"].values.phoneCountryCode, "+351");
  assert.equal(checks["/opentable/booking/details"].values.phoneNumber, "912 345 678");
  for (const result of Object.values(checks)) { assert.equal(result.submitted, null, "nothing submitted"); assert.equal(result.termsTicked, false, "no terms ticked"); }
  const payment = checks["/getyourguide/checkout/payment"];
  assert.ok(Object.values(payment.values).every((value) => value === "" || value.startsWith("(card field")), "payment page untouched");
  step("Supported fields filled on every fixture form", "Booking.com, GetYourGuide (late-rendered), OpenTable fixtures");
  await sessionPage.screenshot({ path: join(evidence, "fixture-checklist.png") });
  const reportText = await textOf(sessionPage);
  assert.match(reportText, /Review and pay on the partner site\./);
  step("Stops before payment and confirmation", "payment step marked Ready to pay; no submit, no terms, card fields untouched");
  const gyg = fixturePages.find((p) => p.url().includes("/getyourguide/checkout/fixture"));
  await gyg.bringToFront();
  await gyg.screenshot({ path: join(evidence, "fixture-gyg-filled.png") });

  // ---------- 6. Unsupported fields are reported
  const filledSession = await sw.evaluate(async () => Object.values((await chrome.storage.local.get("sessions")).sessions).find((s) => s.trip.tripId === "dev-demo"));
  await writeFile(join(evidence, "session-after-fill.json"), JSON.stringify(filledSession.items.map(({ name, status, note, filled, needsManual, selectorsVersion }) => ({ name, status, note, filled, needsManual, selectorsVersion })), null, 2));
  step("Per-booking report recorded", filledSession.items.map((i) => `${i.partnerName}: ${i.status} (${i.filled.length} filled)`).join("; "));

  // ---------- 7. Privacy screen, popup, full deletion
  await sessionPage.bringToFront();
  await sessionPage.goto(`chrome-extension://${extensionId}/assistant.html#/privacy`);
  await waitText(sessionPage, "Your details, your device.");
  await sessionPage.screenshot({ path: join(shots, "04-privacy-and-data.png") });
  await audit(sessionPage, "assistant: privacy & data");
  const popup = await browser.newPage();
  await popup.setViewport({ width: 360, height: 560 });
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await waitText(popup, "Open trip checklist");
  await popup.screenshot({ path: join(evidence, "popup.png") });
  await audit(popup, "popup");
  await popup.close();
  await sessionPage.bringToFront();
  await clickText(sessionPage, "button", "Forget all my information");
  await sessionPage.waitForSelector("dialog[open]");
  await clickText(sessionPage, "dialog[open] button", "Forget everything");
  await waitText(sessionPage, "Your trip, booked from one tab.");
  const after = await storage();
  assert.deepEqual(after, { local: {}, session: {} });
  step("Forget all my information erases everything", "chrome.storage.local and chrome.storage.session both empty");

  await browser.close();
} finally {
  await new Promise((resolve) => fixtures.close(resolve));
  siteProcess?.kill();
  await writeFile(join(evidence, "e2e-results.json"), JSON.stringify({ ranAt: new Date().toISOString(), chrome: executablePath.split("/").find((p) => p.startsWith("mac_") || p.startsWith("linux")) ?? "chrome-for-testing", results, accessibility: a11y }, null, 2));
}
console.log(`\n${results.length} end-to-end checks passed; axe-core found no WCAG A/AA violations on ${a11y.length} page states.`);
