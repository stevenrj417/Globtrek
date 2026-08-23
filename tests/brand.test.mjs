import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("header restores the original wordmark and supplied transparent mark", async () => {
  const source = await readFile(new URL("../app/components/BrandMark.jsx", import.meta.url), "utf8");
  assert.match(source, /globtrek-wordmark/);
  assert.match(source, /globtrek-g-transparent\.png/);
  assert.match(source, /<Image/);
  assert.doesNotMatch(source, /wordmarkPath|monogramPath/);
});

test("wordmark, G mark, and separate chevron share one dropdown button", async () => {
  const source = await readFile(new URL("../app/components/ProductMenu.jsx", import.meta.url), "utf8");
  assert.match(source, /<span className="globtrek-wordmark">globtrek<\/span>/);
  assert.match(source, /<BrandMark/);
  assert.match(source, /viewBox="0 0 12 8"/);
});

test("brand mark transparency does not rely on blend-mode cleanup", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /\.brand-mark\s*\{|mix-blend-mode:\s*multiply|filter:\s*invert/);
  assert.match(css, /\.globtrek-wordmark/);
});
