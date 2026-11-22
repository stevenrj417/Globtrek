import assert from "node:assert/strict";
import test from "node:test";
import { marketingBoxStartsTicked, subscribeFromTripEmail } from "../app/lib/email/marketingConsent.js";

test("the deals box starts ticked in the US and empty where the law needs a fresh tick", () => {
  assert.equal(marketingBoxStartsTicked("US"), true);
  assert.equal(marketingBoxStartsTicked(null), true);
  for (const country of ["DE", "FR", "GB", "CA", "CH", "NO", "ie"]) assert.equal(marketingBoxStartsTicked(country), false, country);
});

function fakeSupabase(existing) {
  const writes = [];
  return {
    writes,
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() { return { data: existing }; },
        async upsert(row) { writes.push(row); return { error: null }; },
      };
    },
  };
}

const deps = { siteUrl: "https://glob-trek.com", createToken: () => "tok", hashToken: (value) => `h-${value}` };

test("a new address is subscribed and gets an unsubscribe link", async () => {
  const supabase = fakeSupabase(null);
  const result = await subscribeFromTripEmail(supabase, { email: "a@b.co", ...deps });
  assert.equal(result.subscribed, true);
  assert.equal(result.unsubscribeUrl, "https://glob-trek.com/unsubscribe?token=tok");
  assert.equal(supabase.writes[0].marketing_consent, true);
});

test("an address that bounced or complained is never re-added", async () => {
  for (const status of ["bounced", "complained"]) {
    const supabase = fakeSupabase({ id: 1, status });
    assert.equal((await subscribeFromTripEmail(supabase, { email: "a@b.co", ...deps })).subscribed, false);
    assert.equal(supabase.writes.length, 0);
  }
});

test("an existing subscriber keeps their unsubscribe link working", async () => {
  const supabase = fakeSupabase({ id: 1, status: "subscribed" });
  const result = await subscribeFromTripEmail(supabase, { email: "a@b.co", ...deps });
  assert.deepEqual(result, { subscribed: true, unsubscribeUrl: null });
  assert.equal(supabase.writes.length, 0);
});
