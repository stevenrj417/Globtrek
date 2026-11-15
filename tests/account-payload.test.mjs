import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { accountPayload } from "../app/lib/account/accountPayload.js";

const userA = { id: "aaaaaaaa-0000-0000-0000-000000000001", email: "a@example.com", app_metadata: { provider: "google" } };
const tripA = { id: "trip-1", user_id: userA.id, destination_name: "Lisbon" };
const ok = (data) => ({ data, error: null });
const fail = (code, message) => ({ data: null, error: { code, message } });

test("an account with a saved trip returns it", () => {
  const result = accountPayload(userA, { profile: ok({ id: userA.id }), trips: ok([tripA]), saved: ok([]), recent: ok([]), recentSearches: ok([]) });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.trips, [tripA]);
  assert.deepEqual(result.body.unavailable, []);
  assert.equal(result.failures.length, 0);
});

test("a failing extra section no longer hides saved trips", () => {
  const result = accountPayload(userA, { profile: ok(null), trips: ok([tripA]), saved: ok([]), recent: ok([]), recentSearches: fail("42P01", 'relation "public.recent_searches" does not exist') });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.trips, [tripA]);
  assert.deepEqual(result.body.recentSearches, []);
  assert.deepEqual(result.body.unavailable, ["recentSearches"]);
  assert.deepEqual(result.failures.map((failure) => failure.table), ["recent_searches"]);
});

test("a failing saved_trips query is an error, never an empty trip list", () => {
  const result = accountPayload(userA, { profile: ok(null), trips: fail("42501", "permission denied for table saved_trips"), saved: ok([]), recent: ok([]), recentSearches: ok([]) });
  assert.equal(result.status, 500);
  assert.equal(result.body.trips, undefined);
  assert.doesNotMatch(result.body.error, /permission|saved_trips/, "Postgres details stay in the logs");
});

test("an account with no trips gets an empty list", () => {
  const userB = { id: "bbbbbbbb-0000-0000-0000-000000000002", email: "b@example.com" };
  const result = accountPayload(userB, { profile: ok(null), trips: ok([]), saved: ok([]), recent: ok([]), recentSearches: ok([]) });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.trips, []);
  assert.equal(result.body.user.provider, "email");
});

test("the account API scopes every per-user query to the signed-in user", () => {
  const source = readFileSync(new URL("../app/api/account/route.js", import.meta.url), "utf8");
  const get = source.slice(source.indexOf("export async function GET"), source.indexOf("export async function PATCH"));
  for (const table of ["saved_trips", "saved_items", "recent_views", "recent_searches"]) {
    assert.match(get, new RegExp(`from\\("${table}"\\)\\.select\\("\\*"\\)\\.eq\\("user_id", user\\.id\\)`), `${table} is filtered by user_id`);
  }
  assert.match(get, /from\("profiles"\)\.select\("\*"\)\.eq\("id", user\.id\)/);
  assert.match(get, /no-store/, "account data is never cached");
});

test("the account page shows an error, not the empty state, when loading fails", () => {
  const source = readFileSync(new URL("../app/account/AccountClient.jsx", import.meta.url), "utf8");
  assert.match(source, /if \(!response\.ok\) throw/);
  assert.match(source, /loadError \? <div role="alert"/);
  assert.match(source, /loadError === "session"/);
});
