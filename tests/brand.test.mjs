import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("header brand mark is transparent scalable vector geometry", async () => {
  const source = await readFile(new URL("../app/components/BrandMark.jsx", import.meta.url), "utf8");
  assert.match(source, /<svg/);
  assert.match(source, /viewBox="0 0 5400 1000"/);
  assert.match(source, /stroke="currentColor"/);
  assert.match(source, /wordmarkPath/);
  assert.match(source, /monogramPath/);
  assert.doesNotMatch(source, /globtrek-mark\.png|<Image|<img/);
});

test("header uses one vector lockup and a separate vector chevron", async () => {
  const source = await readFile(new URL("../app/components/ProductMenu.jsx", import.meta.url), "utf8");
  assert.match(source, /<BrandLockup/);
  assert.doesNotMatch(source, /<span>globtrek<\/span>|<BrandMark/);
  assert.match(source, /viewBox="0 0 12 8"/);
});

test("brand mark does not rely on raster blend-mode cleanup", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /\.brand-mark\s*\{|mix-blend-mode:\s*multiply|filter:\s*invert/);
});
