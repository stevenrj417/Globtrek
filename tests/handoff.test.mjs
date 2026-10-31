import test from "node:test";
import assert from "node:assert/strict";
import { handoffContext, handoffHref, isPartnerUrl } from "../app/lib/handoff.js";
import { bookingPropertyUrl } from "../app/data/destinations.js";

test("handoff only forwards to booking partners", () => {
  assert.equal(isPartnerUrl("https://www.booking.com/hotel/pt/x.html"), true);
  assert.equal(isPartnerUrl("https://www.kqzyfj.com/click-1?url=x"), true);
  assert.equal(isPartnerUrl("https://evil.example/booking.com"), false);
  assert.equal(isPartnerUrl("https://booking.com.evil.example/"), false);
  assert.equal(isPartnerUrl("http://www.booking.com/"), false);
  assert.equal(isPartnerUrl("javascript:alert(1)"), false);
});

test("handoff reads dates and travelers through the affiliate wrapper", () => {
  const url = bookingPropertyUrl({ bookingUrl: "https://www.booking.com/hotel/pt/example.html" }, { tripStart: "2027-04-12", tripEnd: "2027-04-17", guestCount: "2" });
  assert.ok(url.startsWith("https://www.kqzyfj.com/"), "keeps the CJ tracking wrapper");
  assert.deepEqual(handoffContext(url), { checkin: "2027-04-12", checkout: "2027-04-17", adults: 2 });
  assert.match(handoffHref({ url, name: "Example" }), /^\/go\?to=https%3A%2F%2Fwww\.kqzyfj\.com/);
});
