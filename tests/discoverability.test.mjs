import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { llmsFullText, llmsText } from "../app/lib/llms.js";

const robotsSource = readFileSync(new URL("../app/robots.js", import.meta.url), "utf8");
const privatePaths = JSON.parse(robotsSource.match(/PRIVATE_PATHS = (\[[^\]]*\])/)[1]);

test("robots keeps personal routes private without blocking public pages", () => {
  for (const path of ["/api/", "/account", "/my-trips", "/results", "/trip/", "/s/", "/auth/"]) assert.ok(privatePaths.includes(path), path);
  for (const page of ["/", "/discover", "/destinations/lisbon", "/booking-assistant", "/how-it-works", "/help", "/llms.txt"]) {
    assert.ok(!privatePaths.some((path) => path !== "/" && page.startsWith(path)), `${page} is crawlable`);
  }
});

test("llms.txt is factual: no secrets, no private routes, no claimed endorsements", () => {
  const text = llmsFullText();
  assert.ok(text.startsWith(llmsText()));
  assert.match(text, /^# GlobTrek\n\n> /);
  assert.match(text, /not an endorsement/);
  assert.doesNotMatch(text, /official partner|Partner Program|rated \d|reviews?:/i);
  assert.doesNotMatch(text, /api\/|\/account|\/results|_KEY|TOKEN|SECRET|@gmail/i);
  assert.match(text, /\/destinations\/lisbon\): \$/);
});
