import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inAppBrowserName } from "../app/lib/inAppBrowser.js";

test("recognizes social apps' built-in browsers", () => {
  assert.equal(inAppBrowserName("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_37.5.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US"), "TikTok");
  assert.equal(inAppBrowserName("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 trill_370504 BytedanceWebview/d8a21c6"), "TikTok");
  assert.equal(inAppBrowserName("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 352.0.0.21.88 (iPhone15,2; iOS 18_1; en_US)"), "Instagram");
  assert.equal(inAppBrowserName("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0.0.40.108]"), "Facebook");
});

test("leaves real browsers alone", () => {
  assert.equal(inAppBrowserName("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1"), null);
  assert.equal(inAppBrowserName("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"), null);
  assert.equal(inAppBrowserName(""), null);
});

test("the sign-in sheet hides Google inside in-app browsers", () => {
  const source = readFileSync(new URL("../app/components/AuthSheet.jsx", import.meta.url), "utf8");
  assert.match(source, /inApp \? <p[^]*Google sign-in doesn&apos;t work inside \{inApp\}[^]*: <button type="button" onClick=\{\(\) => continueWith\("google"\)\}/);
});

test("the AI day plan can't hold the traveler past the thinking screen", () => {
  const route = readFileSync(new URL("../app/api/match/route.js", import.meta.url), "utf8");
  const thinking = readFileSync(new URL("../app/thinking/page.jsx", import.meta.url), "utf8");
  const timeout = Number(route.match(/AI_PLAN_TIMEOUT_MS = (\d+)/)[1]);
  const cap = Number(thinking.match(/const MAX_MS = (\d+)/)[1]);
  assert.match(route, /signal: AbortSignal\.timeout\(AI_PLAN_TIMEOUT_MS\)/);
  assert.match(route, /aiStatus: "timeout"/);
  assert.ok(timeout + 1500 <= cap, `AI cap ${timeout}ms leaves room under the ${cap}ms screen cap`);
});
