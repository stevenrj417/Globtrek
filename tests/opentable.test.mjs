import assert from "node:assert/strict";
import test from "node:test";
import { OpenTableClient, OpenTableError, createReservationLink } from "../app/lib/restaurants/OpenTableClient.js";
import { RestaurantInventoryProvider } from "../app/lib/restaurants/RestaurantInventoryProvider.js";

function response(body, status = 200, headers = {}) { return new Response(body == null ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } }); }

test("OpenTable referral attribution is added only to OpenTable links", () => {
  assert.match(createReservationLink("https://www.opentable.com/r/example?covers=2", "globtrek-ref"), /ref=globtrek-ref/);
  assert.equal(createReservationLink("https://example.com/r/example", "globtrek-ref"), "https://example.com/r/example");
  assert.equal(createReservationLink("not a url", "globtrek-ref"), null);
});

test("OpenTable client obtains a server-side token and returns attributed availability", async () => {
  const calls = [];
  const client = new OpenTableClient({ apiBaseUrl: "https://api.partner.test", oauthBaseUrl: "https://oauth.partner.test", clientId: "id", clientSecret: "secret", referralId: "globtrek", retries: 0, fetchImpl: async (url, options) => {
    calls.push({ url: String(url), authorization: options.headers.Authorization });
    if (String(url).includes("oauth/token")) return response({ access_token: "token", expires_in: 300 });
    return response({ data: [{ times: [{ booking_url: "https://www.opentable.com/booking/abc" }] }] });
  } });
  const result = await client.getAvailability({ restaurantId: 123, startDateTime: "2026-09-01T19:15", partySize: 2 });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].authorization, "Bearer token");
  assert.match(result.bookingUrl, /ref=globtrek/);
});

test("OpenTable client exposes rate limiting without leaking credentials", async () => {
  const client = new OpenTableClient({ apiBaseUrl: "https://api.partner.test", oauthBaseUrl: "https://oauth.partner.test", clientId: "id", clientSecret: "top-secret", retries: 0, fetchImpl: async (url) => String(url).includes("oauth/token") ? response({ access_token: "token" }) : response({ errors: [] }, 429, { "retry-after": "5" }) });
  await assert.rejects(() => client.getAvailability({ restaurantId: 123, startDateTime: "2026-09-01T19:15", partySize: 2 }), (error) => error instanceof OpenTableError && error.code === "opentable_rate_limited" && error.retryAfter === "5" && !error.message.includes("top-secret"));
});

test("OpenTable input validation happens before network access", async () => {
  const client = new OpenTableClient({ fetchImpl: async () => { throw new Error("network should not be called"); } });
  await assert.rejects(() => client.getAvailability({ restaurantId: "invented", startDateTime: "tomorrow", partySize: 0 }), /numeric OpenTable restaurant ID/);
  await assert.rejects(() => new RestaurantInventoryProvider().searchRestaurants(), /must be implemented/);
});
