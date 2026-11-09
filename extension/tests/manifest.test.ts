import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error — plain .mjs build helper without type declarations
import { buildManifest, DESCRIPTION, ENABLED_PARTNER_ORIGINS } from "../scripts/manifest.mjs";
import { ADAPTERS } from "../src/adapters/index.ts";
import { partnerById } from "../src/shared/partners.ts";

const prod = buildManifest({ version: "1.0.0", dev: false });

test("production manifest asks for the fewest permissions", () => {
  assert.equal(prod.manifest_version, 3);
  assert.deepEqual(prod.permissions, ["storage", "scripting"]);
  assert.equal(prod.host_permissions, undefined);
  const text = JSON.stringify(prod);
  for (const banned of ["<all_urls>", "\"tabs\"", "history", "cookies", "downloads", "clipboard", "debugger", "webRequest", "*://*/*", "localhost", "vercel.app"]) assert.ok(!text.includes(banned), banned);
  assert.deepEqual(prod.content_scripts[0].matches, ["https://www.glob-trek.com/*"]);
  assert.ok(DESCRIPTION.length <= 132);
});

test("optional host permissions are exactly the partners whose adapters are enabled", () => {
  const enabled = ADAPTERS.filter((adapter) => adapter.policy.autofill).flatMap((adapter) => partnerById(adapter.id).originPatterns);
  assert.deepEqual([...ENABLED_PARTNER_ORIGINS].sort(), [...enabled].sort());
  assert.deepEqual(prod.optional_host_permissions, ENABLED_PARTNER_ORIGINS);
});

test("CSP forbids remote and inline code", () => {
  const csp = prod.content_security_policy.extension_pages;
  assert.match(csp, /script-src 'self';/);
  assert.ok(!/unsafe-eval|unsafe-inline|https?:/.test(csp));
});

test("adapters are versioned, host-restricted and never describe a submit control", () => {
  for (const adapter of ADAPTERS) {
    assert.match(adapter.selectorsVersion, /\d|contract/);
    assert.ok(adapter.hosts.length > 0 && adapter.hosts.every((host) => /^[a-z0-9.-]+$/.test(host) && !host.startsWith(".")));
    for (const field of adapter.fields) for (const selector of field.selectors) assert.ok(!/button|type=['"]?submit|\[type=['"]?checkbox/i.test(selector), `${adapter.id}: ${selector}`);
    assert.ok(adapter.timeoutMs <= 15000 && adapter.maxPasses <= 5);
    assert.ok(adapter.unsupported.length > 0, "every adapter documents what it can't do");
  }
});
