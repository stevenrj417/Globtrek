// A short "what it is" for every place matched to a Wikipedia article
// (app/data/placePhotos.json): the article's opening paragraph, plain text,
// from the free Wikipedia API. Text is CC BY-SA; the details panel credits it
// with a link to the article. Writes app/data/placeAbout.json. Resumes.
//   node scripts/places/fetch-place-about.mjs
import { readFile, writeFile } from "node:fs/promises";

const UA = "GlobTrekPhotoMatcher/1.1 (https://www.glob-trek.com)";
const photos = JSON.parse(await readFile(new URL("../../app/data/placePhotos.json", import.meta.url), "utf8")).photos;
const outUrl = new URL("../../app/data/placeAbout.json", import.meta.url);
let out = { source: "English Wikipedia article introductions (CC BY-SA 4.0)", about: {} };
try { out = JSON.parse(await readFile(outUrl, "utf8")); } catch {}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function getJson(url) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA } }).catch(() => null);
    if (response?.ok) return response.json();
    await sleep(Math.min(60, Math.max(Number(response?.headers.get("retry-after")) || 0, 2 ** attempt)) * 1000);
  }
  throw new Error("Wikipedia did not answer");
}

const articles = [...new Set(Object.values(photos).map((photo) => photo.article))].filter((title) => !(title in out.about));
console.log(`${articles.length} articles to fetch`);
for (let index = 0; index < articles.length; index += 20) {
  const batch = articles.slice(index, index + 20);
  const data = await getJson(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&exlimit=20&redirects=1&titles=${encodeURIComponent(batch.join("|"))}`);
  const back = {};
  for (const item of [...(data?.query?.normalized || []), ...(data?.query?.redirects || [])]) back[item.to] = back[item.from] || item.from;
  for (const page of Object.values(data?.query?.pages || {})) {
    const title = back[page.title] || page.title;
    const text = String(page.extract || "").replace(/\s*\([^()]*(?:listen|pronounced|IPA)[^()]*\)/g, "").replace(/\n+/g, "\n").trim();
    // At most three paragraphs and about 700 characters, cut at a sentence.
    let short = text.split("\n").slice(0, 3).join("\n\n");
    if (short.length > 700) short = short.slice(0, 700).replace(/[^.!?]*$/, "").trim();
    out.about[title] = short || "";
  }
  for (const title of batch) if (!(title in out.about)) out.about[title] = "";
  if ((index / 20) % 10 === 9) await writeFile(outUrl, `${JSON.stringify(out)}\n`);
  await sleep(200);
}
await writeFile(outUrl, `${JSON.stringify(out)}\n`);
console.log(`${Object.values(out.about).filter(Boolean).length} articles have an introduction`);
