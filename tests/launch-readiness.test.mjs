import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { destinations } from "../app/data/destinations.js";
import { normalizeTravelerProfile } from "../app/lib/recommendation/travelerProfile.js";
import { closestOverBudget, compareMatches, hardFilterFailure, matchExplanation, MATCH_ALGORITHM_VERSION, rankDestinations, validateMatch } from "../app/lib/recommendation/destinationEngine.js";
import { destinationReadiness } from "../app/lib/recommendation/eligibility.js";
import { matchReasons } from "../app/lib/recommendation/whyThisFits.js";
import { tripLengthRange } from "../app/lib/recommendation/eligibility.js";
import { structuredOrigin } from "../app/lib/recommendation/travelArea.js";
import { buildBudgetPlan } from "../app/lib/recommendation/budgetEngine.js";
import { travelPeriod } from "../app/lib/trip/period.js";
import { estimateChanged, makeSnapshot, quizKey, resultId, snapshotEstimate } from "../app/lib/results/snapshot.js";
import { openShareToken, sealShareToken } from "../app/lib/results/shareToken.js";
import { rateLimit, resetRateLimits } from "../app/lib/security/rateLimit.js";
import { safeNextPath } from "../app/lib/security/redirects.js";
import { scrubMessage } from "../app/lib/security/scrub.js";
import { AFFILIATE_DISCLOSURE } from "../app/lib/site.js";

const quiz = (answers, extra = {}) => ({ answers: { duration: "Five Nights", hotel: "Whatever's cheapest", ...answers }, exactBudget: extra.budget ?? 1500, guestCount: "1", isFlexible: true, originAirport: "LAX", originDetails: structuredOrigin("LAX"), travelAreaPreference: "anywhere", ...extra });
const SETTING_TAG = { Ocean: "Ocean", Mountains: "Mountains", Cities: "Cities", Culture: "Culture" };

// The twelve combinations from the launch checklist.
const COMBINATIONS = [
  ["Mountains", "Nature", "Balanced days", 800],
  ["Mountains", "Nature", "Adventure days", 1500],
  ["Mountains", "Wellness", "Mostly relaxing", 5000],
  ["Ocean", "Nightlife", "Packed schedule", 800],
  ["Ocean", "Wellness", "Slow mornings", 1500],
  ["Ocean", "Wellness", "Mostly relaxing", 5000],
  ["Cities", "Food", "Balanced days", 800],
  ["Cities", "Culture", "Packed schedule", 1500],
  ["Cities", "Shopping", "Balanced days", 5000],
  ["Culture", "Culture", "Slow mornings", 1500],
  ["Surprise Me", "Food", "Surprise me", 600],
  ["Surprise Me", "Nature", "Surprise me", 6000],
];

for (const [setting, interest, pace, budget] of COMBINATIONS) {
  test(`${setting} + ${interest} + ${pace} at $${budget}: right setting, within budget, or an honest no-match`, () => {
    const input = quiz({ alive: setting, luxury: interest, escape: pace }, { budget });
    const profile = normalizeTravelerProfile(input);
    const ranked = rankDestinations(destinations, profile);
    if (!ranked.length) {
      const closest = closestOverBudget(destinations, profile);
      if (closest) {
        assert.ok(closest.budgetPlan.budgetCheckTotal > budget, "closest match is labeled over budget");
        if (SETTING_TAG[setting]) assert.ok(closest.tags.includes(SETTING_TAG[setting]));
      }
      return;
    }
    for (const match of ranked) {
      if (SETTING_TAG[setting]) assert.ok(match.tags.includes(SETTING_TAG[setting]), `${match.id} lacks ${setting}`);
      assert.ok(match.budgetPlan.budgetCheckTotal <= budget, `${match.id} over budget`);
      assert.deepEqual(validateMatch(match, profile), [], match.id);
      assert.equal(match.algorithmVersion, MATCH_ALGORITHM_VERSION);
    }
  });
}

test("Mountains + Nature never returns a non-mountain destination at any budget", () => {
  for (const budget of [600, 1000, 1500, 2500, 5000, 20000]) {
    const ranked = rankDestinations(destinations, normalizeTravelerProfile(quiz({ alive: "Mountains", luxury: "Nature" }, { budget })));
    assert.ok(ranked.every((item) => item.tags.includes("Mountains")), `budget ${budget}`);
  }
});

test("matching is deterministic: same answers, same order, same scores", () => {
  const input = quiz({ alive: "Cities", luxury: "Food", escape: "Balanced days" }, { budget: 2500 });
  const first = rankDestinations(destinations, normalizeTravelerProfile(input)).map((item) => `${item.id}:${item.destinationMatchScore}`);
  const second = rankDestinations(destinations, normalizeTravelerProfile(structuredClone(input))).map((item) => `${item.id}:${item.destinationMatchScore}`);
  assert.deepEqual(first, second);
});

test("ties break on the lower estimate, then the id", () => {
  const base = { travelFeasibility: { status: "reasonable" }, destinationMatchScore: 70 };
  const cheap = { ...base, id: "b", budgetPlan: { budgetCheckTotal: 900 } };
  const dear = { ...base, id: "a", budgetPlan: { budgetCheckTotal: 1100 } };
  const twin = { ...base, id: "c", budgetPlan: { budgetCheckTotal: 900 } };
  assert.deepEqual([dear, twin, cheap].sort(compareMatches).map((item) => item.id), ["b", "c", "a"]);
});

test("the explanation records the version, the winner's score parts and why it beat the runner-up", () => {
  const ranked = rankDestinations(destinations, normalizeTravelerProfile(quiz({ alive: "Cities", luxury: "Food" }, { budget: 2500 })));
  const explanation = matchExplanation(ranked);
  assert.equal(explanation.algorithmVersion, MATCH_ALGORITHM_VERSION);
  assert.equal(explanation.winner.id, ranked[0].id);
  assert.ok(Object.keys(explanation.winner.components).includes("interest"));
  assert.ok(explanation.reason.length > 10);
});

test("incomplete destinations are never recommended", () => {
  const incomplete = destinations.filter((item) => !destinationReadiness(item).eligible);
  assert.ok(incomplete.length > 0);
  for (const destination of incomplete.slice(0, 40)) assert.equal(hardFilterFailure(destination, normalizeTravelerProfile(quiz({}))), "incomplete", destination.id);
  assert.equal(destinationReadiness(destinations.find((item) => item.id === "kazbegi-mtn")).eligible, false, "Kazbegi has no stays yet");
});

test("at least ten complete mountain destinations, each with stays, activities and a reviewed season", () => {
  const mountains = destinations.filter((item) => item.tags?.includes("Mountains") && destinationReadiness(item).eligible);
  assert.ok(mountains.length >= 10, `${mountains.length} mountain destinations`);
});

test("why-this-matches lists only reasons that are true", () => {
  const input = quiz({ alive: "Mountains", luxury: "Nature", escape: "Balanced days" }, { budget: 5000 });
  const profile = normalizeTravelerProfile(input);
  const trip = rankDestinations(destinations, profile)[0];
  const reasons = matchReasons({ answers: input.answers, profile, budgetPlan: trip.budgetPlan, trip, range: tripLengthRange(trip) });
  assert.ok(reasons.includes("Mountain setting"));
  assert.ok(reasons.includes("Fits your five-night target"));
  assert.ok(reasons.includes("Estimated within your $5,000 budget"));
  const over = matchReasons({ answers: input.answers, profile, budgetPlan: { ...trip.budgetPlan, withinHardBudget: false }, trip, range: tripLengthRange(trip) });
  assert.ok(!over.some((reason) => reason.includes("budget")));
  const notMountain = matchReasons({ answers: { alive: "Ocean" }, profile, budgetPlan: trip.budgetPlan, trip: { ...trip, tags: ["Cities"] }, range: tripLengthRange(trip) });
  assert.ok(!notMountain.includes("Coastal setting"));
});

test("a flexible winter trip asked in November 2026 is December 2026–February 2027", () => {
  const period = travelPeriod({ flexible: true, season: "Winter (Dec-Feb)" }, new Date("2026-11-11T12:00:00Z"));
  assert.equal(period.label, "December 2026–February 2027");
  assert.deepEqual(period.months, ["2026-12", "2027-01", "2027-02"]);
  assert.equal(travelPeriod({ flexible: true, season: "Summer (Jun-Aug)" }, new Date("2026-11-11T12:00:00Z")).label, "June–August 2027");
});

test("a flexible seasonal trip prices flights, stay and daily costs in the same month", () => {
  const profile = normalizeTravelerProfile(quiz({ alive: "Cities", season: "Summer (Jun-Aug)" }));
  const destination = destinations.find((item) => item.id === "MEX");
  const plan = buildBudgetPlan(profile, destination);
  assert.ok([6, 7, 8].includes(plan.pricedMonth), `priced for month ${plan.pricedMonth}`);
  if (plan.lodging.month) assert.equal(plan.lodging.month, plan.pricedMonth);
});

test("result ids are stable for the same answers and change with the destination", () => {
  const a = quiz({ alive: "Cities", luxury: "Food" });
  const b = { ...structuredClone(a), answers: Object.fromEntries(Object.entries(a.answers).reverse()) };
  assert.equal(quizKey(a), quizKey(b));
  assert.equal(resultId(a, "MEX"), resultId(b, "MEX"));
  assert.notEqual(resultId(a, "MEX"), resultId(a, "LIS"));
});

test("a snapshot freezes the estimate and flags a later change", () => {
  const input = quiz({ alive: "Cities", luxury: "Food" });
  const trip = rankDestinations(destinations, normalizeTravelerProfile(input))[0];
  const snapshot = makeSnapshot({ quiz: input, destinationId: trip.id, budgetPlan: trip.budgetPlan, now: new Date("2026-11-11T10:00:00Z") });
  assert.equal(snapshot.generatedAt, "2026-11-11T10:00:00.000Z");
  assert.equal(snapshot.estimate.total, Math.round(trip.budgetPlan.budgetCheckTotal));
  assert.equal(estimateChanged(snapshot.estimate, snapshotEstimate(trip.budgetPlan)), false);
  assert.equal(estimateChanged(snapshot.estimate, { ...snapshot.estimate, total: snapshot.estimate.total + 40 }), true);
});

test("share tokens are opaque, tamper-proof and expire", () => {
  const payload = { quiz: { answers: { alive: "Cities" }, originAirport: "LAX" }, destination: "MEX" };
  const { token } = sealShareToken(payload, { now: Date.parse("2026-11-11T00:00:00Z") });
  assert.ok(!token.includes("LAX") && !Buffer.from(token.slice(3), "base64url").toString("latin1").includes("Cities"));
  assert.deepEqual(openShareToken(token, { now: Date.parse("2026-12-01T00:00:00Z") }).payload, payload);
  assert.equal(openShareToken(token, { now: Date.parse("2027-03-01T00:00:00Z") }).error, "expired");
  const tampered = `${token.slice(0, -4)}${token.slice(-4) === "AAAA" ? "BBBB" : "AAAA"}`;
  assert.equal(openShareToken(tampered).error, "invalid");
  assert.equal(openShareToken("eyJxdWl6Ijp7fX0").error, "invalid");
});

test("rate limits answer 429 once a client goes over", () => {
  resetRateLimits();
  const request = { headers: new Headers({ "x-forwarded-for": "203.0.113.9" }) };
  for (let index = 0; index < 3; index += 1) assert.equal(rateLimit(request, { name: "t", limit: 3, now: 1000 + index }), null);
  const limited = rateLimit(request, { name: "t", limit: 3, now: 1004 });
  assert.equal(limited.status, 429);
  assert.ok(limited.headers.get("Retry-After"));
  assert.equal(rateLimit(request, { name: "t", limit: 3, now: 70000 }), null, "the window slides");
});

test("sign-in only returns to paths on this site", () => {
  assert.equal(safeNextPath("/account"), "/account");
  assert.equal(safeNextPath("/results?destination=MEX"), "/results?destination=MEX");
  for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "\\\\evil.example", "javascript:alert(1)", "/%0d%0aSet-Cookie:x", ""]) assert.ok(["/", "/%0d%0aSet-Cookie:x"].includes(safeNextPath(bad)), bad);
});

test("feedback text loses emails and phone numbers", () => {
  assert.equal(scrubMessage("price wrong, mail me at a.b@example.com or +1 (503) 555-0100"), "price wrong, mail me at [email removed] or [number removed]");
});

test("every saved-trip query is scoped to the signed-in user, and RLS covers user tables", () => {
  for (const file of ["app/api/trips/[id]/route.js", "app/api/trips/[id]/share/route.js", "app/api/trips/[id]/duplicate/route.js", "app/api/account/export/route.js"]) {
    const source = readFileSync(file, "utf8");
    const chains = source.split(/\.from\("saved_trips"\)/).slice(1);
    assert.ok(chains.length > 0, file);
    for (const chain of chains) {
      const statement = chain.split(";")[0];
      // Inserts set the owner in the row itself; everything else filters on it.
      if (/^\.insert\(copy\)/.test(statement)) assert.match(source, /user_id: auth\.user\.id/, file);
      else assert.match(statement, /\.eq\("user_id", (user|auth\.user)\.id\)/, file);
    }
  }
  const migrations = readdirSync("supabase/migrations").map((name) => readFileSync(join("supabase/migrations", name), "utf8")).join("\n");
  for (const table of ["saved_trips", "profiles", "saved_items", "recent_views", "recent_searches"]) assert.match(migrations, new RegExp(`alter table public\\.${table} enable row level security`), table);
  assert.match(migrations, /on public\.saved_trips for select using \(auth\.uid\(\) = user_id\)/);
});

test("client code never reads a server secret", () => {
  const files = [];
  const walk = (dir) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "api") walk(path); } else if (/\.(jsx?|mjs)$/.test(name)) files.push(path); } };
  walk("app");
  const offenders = files.filter((file) => { const source = readFileSync(file, "utf8"); return /^["']use client["']/.test(source) && /process\.env\.(?!NEXT_PUBLIC_|NODE_ENV)/.test(source); });
  assert.deepEqual(offenders, []);
});

test("the affiliate disclosure is the exact required sentence, and the footer uses it", () => {
  assert.equal(AFFILIATE_DISCLOSURE, "GlobTrek may earn a commission from qualifying bookings. Compare the provider's final price, fees and terms before booking.");
  assert.match(readFileSync("app/components/SiteChrome.jsx", "utf8"), /\{AFFILIATE_DISCLOSURE\}/);
  assert.doesNotMatch(readFileSync("app/components/SiteChrome.jsx", "utf8"), /price doesn&apos;t change/);
});

test("security headers are set for every page", () => {
  const config = readFileSync("next.config.mjs", "utf8");
  for (const header of ["Content-Security-Policy", "Strict-Transport-Security", "Referrer-Policy", "Permissions-Policy", "X-Content-Type-Options", "X-Frame-Options"]) assert.match(config, new RegExp(header));
  assert.match(config, /frame-ancestors 'none'/);
});
