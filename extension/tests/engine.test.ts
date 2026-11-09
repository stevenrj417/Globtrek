import test from "node:test";
import assert from "node:assert/strict";
import { domFor, sampleProfile } from "./helpers.ts";
import { fillPage, detectPage, chooseOption, setValueLikeUser } from "../src/content/engine.ts";
import { bookingAdapter } from "../src/adapters/booking.ts";
import { getYourGuideAdapter } from "../src/adapters/getyourguide.ts";
import { openTableAdapter } from "../src/adapters/opentable.ts";
import { resolveFields } from "../src/profile/fields.ts";
import { adapterFieldKeys } from "../src/adapters/types.ts";
import { sanitizeProfile } from "../src/profile/sanitize.ts";

const profile = sanitizeProfile(sampleProfile());
const valuesFor = (adapter: typeof bookingAdapter) => resolveFields(profile, adapterFieldKeys(adapter));

function watchSubmits(document: Document) {
  const events: string[] = [];
  document.addEventListener("submit", () => events.push("submit"), true);
  document.addEventListener("click", (event) => events.push(`click:${(event.target as Element).tagName}`), true);
  return events;
}

test("Booking.com fixture: every mapped field fills; terms, password and hidden fields are untouched; nothing submits", async () => {
  const { window, document } = domFor("booking-details.html", "https://secure.booking.com/book.html?hotel_id=1");
  const events = watchSubmits(document);
  const report = await fillPage(document, bookingAdapter, valuesFor(bookingAdapter), { pathname: "/book.html" });
  const get = (selector: string) => (document.querySelector(selector) as HTMLInputElement).value;
  assert.equal(report.pageKind, "details");
  assert.equal(get("#firstname"), "Ana");
  assert.equal(get("#lastname"), "Costa");
  assert.equal(get("#email"), "ana@example.com");
  assert.equal(get("#email_confirm"), "ana@example.com");
  assert.equal(get("#phone"), "+351 912 345 678");
  assert.equal(get("#address1"), "Rua Augusta 1");
  assert.equal(get("#zip"), "1100-048");
  assert.equal(get("#cc1"), "pt");
  assert.equal(get("#checkin_eta_hour"), "15");
  assert.match(get("#remarks"), /King bed/);
  assert.equal((document.querySelector("[name=agree_terms]") as HTMLInputElement).checked, false);
  assert.equal(get("#account_password"), "");
  assert.equal(get("[name=hotel_id]"), "fixture");
  assert.equal(report.filled.length, 11);
  assert.deepEqual(report.skipped, []);
  assert.deepEqual(events.filter((event) => event === "submit" || event === "click:BUTTON"), []);
  assert.equal(document.body.dataset.submitted, undefined);
  window.close();
});

test("values are set so framework-controlled inputs see them (input, change, blur fire; native setter used)", () => {
  const { window, document } = domFor("opentable-details.html", "https://www.opentable.com/booking/details");
  const field = document.querySelector("#firstName") as HTMLInputElement;
  // Mimic React's value tracker: an own-property setter that would swallow a plain assignment.
  let tracked = "";
  Object.defineProperty(field, "value", { configurable: true, get() { return tracked; }, set(value: string) { tracked = value; } });
  const seen: string[] = [];
  for (const type of ["input", "change", "blur"]) field.addEventListener(type, () => seen.push(type));
  setValueLikeUser(field, "Ana");
  assert.deepEqual(seen, ["input", "change", "blur"]);
  delete (field as { value?: unknown }).value;
  assert.equal(field.value, "Ana", "the element's real value was set through the prototype setter");
  assert.equal(tracked, "", "the instance override was bypassed, as React requires to detect the change");
  window.close();
});

test("existing typed values are never overwritten", async () => {
  const { window, document } = domFor("booking-details.html", "https://secure.booking.com/book.html");
  (document.querySelector("#firstname") as HTMLInputElement).value = "Anabela";
  const report = await fillPage(document, bookingAdapter, valuesFor(bookingAdapter), { pathname: "/book.html" });
  assert.equal((document.querySelector("#firstname") as HTMLInputElement).value, "Anabela");
  assert.deepEqual(report.skipped.map((field) => [field.key, field.reason]), [["lead.firstName", "kept_existing"]]);
  window.close();
});

test("payment pages: nothing is filled, card fields are never touched or read, status is ready to pay", async () => {
  const { window, document } = domFor("booking-payment.html", "https://secure.booking.com/book.html?stage=2");
  const card = document.querySelector("#cc_number") as HTMLInputElement;
  let reads = 0;
  const proto = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(card), "value")!;
  Object.defineProperty(card, "value", { configurable: true, get() { reads += 1; return proto.get!.call(card); }, set(value) { proto.set!.call(card, value); } });
  const report = await fillPage(document, bookingAdapter, { ...valuesFor(bookingAdapter), "lead.fullName": "Ana Costa" }, { pathname: "/book.html" });
  assert.equal(report.pageKind, "payment");
  assert.equal(report.paymentFieldsPresent, true);
  assert.equal(report.filled.length, 0);
  assert.equal(reads, 0, "the engine never read a card field's value");
  assert.equal(card.value, "");
  assert.equal((document.querySelector("#cc_name") as HTMLInputElement).value, "");
  window.close();
});

test("late-rendered forms are filled via MutationObserver within the timeout", async () => {
  const { window, document } = domFor("gyg-checkout.html", "https://www.getyourguide.com/checkout/abc");
  const pending = fillPage(document, getYourGuideAdapter, valuesFor(getYourGuideAdapter), { pathname: "/checkout/abc", timeoutMs: 2000 });
  window.setTimeout(() => {
    document.getElementById("root")!.innerHTML = '<form><input name="firstName" autocomplete="given-name"><input name="lastName" autocomplete="family-name"><input type="email" name="email" autocomplete="email"><select name="phoneCountryCode" autocomplete="tel-country-code"><option value="">Code</option><option value="+351">Portugal +351</option><option value="+1">United States +1</option></select><input type="tel" name="phoneNumber" autocomplete="tel-national"><textarea name="comment"></textarea></form>';
  }, 120);
  const report = await pending;
  assert.equal(report.timedOut, false);
  assert.ok(report.passes >= 2);
  assert.equal((document.querySelector("[name=firstName]") as HTMLInputElement).value, "Ana");
  assert.equal((document.querySelector("[name=phoneCountryCode]") as HTMLSelectElement).value, "+351");
  assert.equal((document.querySelector("[name=phoneNumber]") as HTMLInputElement).value, "912 345 678");
  assert.equal((document.querySelector("[name=comment]") as HTMLTextAreaElement).value, "Step-free room please");
  window.close();
});

test("a changed partner page fails gracefully with a readable report and a timeout", async () => {
  const { window, document } = domFor("booking-changed.html", "https://secure.booking.com/book.html");
  const report = await fillPage(document, bookingAdapter, valuesFor(bookingAdapter), { pathname: "/book.html", timeoutMs: 150 });
  assert.equal(report.timedOut, true);
  assert.equal(report.filled.length, 0);
  assert.ok(report.skipped.every((field) => field.reason === "not_found"));
  assert.ok(report.skipped.some((field) => field.label === "Legal first name"));
  assert.equal((document.querySelector("#gn") as HTMLInputElement).value, "");
  window.close();
});

test("forms inside a third-party frame are detected and left alone", async () => {
  const { window, document } = domFor("gyg-iframe.html", "https://www.getyourguide.com/checkout/abc");
  const report = await fillPage(document, getYourGuideAdapter, valuesFor(getYourGuideAdapter), { pathname: "/checkout/abc", timeoutMs: 100, maxPasses: 1 });
  assert.equal(report.framedForm, true);
  window.close();
});

test("missing profile values are reported, not invented", async () => {
  const { window, document } = domFor("opentable-details.html", "https://www.opentable.com/booking/details");
  const values = resolveFields(profile, ["lead.firstName", "lead.lastName"]);
  const report = await fillPage(document, openTableAdapter, values, { pathname: "/booking/details" });
  assert.deepEqual(report.filled.map((field) => field.key), ["lead.firstName", "lead.lastName"]);
  assert.ok(report.missing.some((field) => field.key === "contact.email"));
  assert.equal((document.querySelector("#email") as HTMLInputElement).value, "");
  window.close();
});

test("page detection per adapter", () => {
  const { window, document } = domFor("booking-changed.html", "https://www.booking.com/hotel/pt/x.html");
  assert.equal(detectPage(bookingAdapter, document, "/hotel/pt/x.html"), "product");
  assert.equal(detectPage(bookingAdapter, document, "/searchresults.html"), "search");
  assert.equal(detectPage(getYourGuideAdapter, document, "/lisbon-l42/sintra-t1234/"), "product");
  assert.equal(detectPage(openTableAdapter, document, "/booking/details"), "details");
  window.close();
});

test("select matching: countries, dial codes and hours", () => {
  const { window, document } = domFor("booking-details.html", "https://secure.booking.com/book.html");
  const country = document.querySelector("#cc1") as HTMLSelectElement;
  assert.equal(chooseOption(country, "USA", "country"), "us");
  assert.equal(chooseOption(country, "United Kingdom", "country"), "gb");
  assert.equal(chooseOption(country, "Atlantis", "country"), null);
  assert.equal(chooseOption(document.querySelector("#checkin_eta_hour") as HTMLSelectElement, "16", "hour"), "16");
  window.close();
});
