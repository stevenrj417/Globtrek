// Imports the GlobTrek destination master list workbook. Safe to re-run: it only
// rewrites the three generated files below, from the workbook alone.
//
//   node scripts/destinations/import-master-list.mjs [path/to/globtrek_destination_master_list.xlsx]
//
// Reads two sheets:
//   Destinations   → app/data/destinationOutcomes.json (one quiz outcome per row)
//   Lodging Prices → app/data/lodgingPriceGuide.json   (typical nightly prices, planning estimates)
// and writes scripts/destinations/master-list-report.json: counts, problems, and
// which outcomes are new destinations still to be built.
//
// Rules: Outcome ID is the permanent key and Exact Match the canonical quiz-result
// string. Both must be unique and are copied byte for byte (no trimming, no case
// changes); a row that breaks a rule is reported and the import stops before
// writing anything. Outcomes link to existing destinations by exact name and
// country, with hand-checked overrides in master-list-links.json.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, statSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const workbookPath = process.argv[2] || new URL("scripts/destinations/globtrek_destination_master_list.xlsx", root).pathname;

// --- Minimal .xlsx reader (zip of XML parts; macOS and Linux ship `unzip`). ---
function part(name) {
  try { return execFileSync("unzip", ["-p", workbookPath, name], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }); } catch { return ""; }
}
const decode = (value) => value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16))).replace(/&amp;/g, "&");
const texts = (xml) => [...xml.matchAll(/<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>/g)].map((match) => decode(match[1])).join("");
const shared = [...part("xl/sharedStrings.xml").matchAll(/<(?:\w+:)?si>([\s\S]*?)<\/(?:\w+:)?si>/g)].map((match) => texts(match[1]));
const relTargets = Object.fromEntries([...part("xl/_rels/workbook.xml.rels").matchAll(/<(?:\w+:)?Relationship\b[^>]*>/g)].map(([tag]) => [tag.match(/Id="([^"]+)"/)[1], tag.match(/Target="([^"]+)"/)[1]]));
const sheetPaths = Object.fromEntries([...part("xl/workbook.xml").matchAll(/<(?:\w+:)?sheet\b[^>]*>/g)].map(([tag]) => {
  const target = relTargets[tag.match(/r:id="([^"]+)"/)[1]].replace(/^\//, "");
  return [decode(tag.match(/name="([^"]+)"/)[1]), target.startsWith("xl/") ? target : `xl/${target}`];
}));
const columnIndex = (letters) => [...letters].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
function sheet(name) {
  if (!sheetPaths[name]) throw new Error(`Workbook has no "${name}" sheet`);
  return [...part(sheetPaths[name]).matchAll(/<(?:\w+:)?row\b[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g)].map(([, row]) => {
    const cells = [];
    for (const [, attributes, body] of row.matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
      const index = columnIndex(attributes.match(/r="([A-Z]+)\d+"/)[1]);
      const type = attributes.match(/t="([^"]+)"/)?.[1];
      const value = body?.match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/)?.[1];
      cells[index] = type === "s" ? shared[Number(value)] : type === "inlineStr" ? texts(body || "") : value == null ? null : decode(value);
    }
    return cells;
  });
}
function table(name, required) {
  const rows = sheet(name);
  const headerAt = rows.findIndex((row) => row?.[0] === "Outcome ID");
  if (headerAt < 0) throw new Error(`"${name}" has no header row starting with Outcome ID`);
  const header = rows[headerAt].map((value) => String(value ?? "").trim());
  const missing = required.filter((column) => !header.includes(column));
  if (missing.length) throw new Error(`"${name}" is missing columns: ${missing.join(", ")}`);
  return rows.slice(headerAt + 1).map((row, offset) => ({ sheetRow: headerAt + offset + 2, row })).filter(({ row }) => row?.some((cell) => cell != null && String(cell).trim() !== "")).map(({ sheetRow, row }) => ({ sheetRow, ...Object.fromEntries(header.map((column, index) => [column, row[index] ?? null])) }));
}

// --- Destinations sheet ---
const DEST_COLUMNS = ["Outcome ID", "Exact Match", "Destination", "State / Province", "Country", "Region", "Destination Type", "Recognition", "Best For", "Scope"];
const REQUIRED = ["Outcome ID", "Exact Match", "Destination", "Country", "Region", "Destination Type", "Recognition", "Scope"];
const problems = [];
const destinationRows = table("Destinations", DEST_COLUMNS);
const byId = new Map();
const byExact = new Map();
for (const row of destinationRows) {
  const where = `Destinations row ${row.sheetRow}`;
  for (const column of REQUIRED) if (row[column] == null || String(row[column]).trim() === "") problems.push(`${where}: missing ${column}`);
  const id = row["Outcome ID"];
  const exact = row["Exact Match"];
  if (id != null && !/^GT-\d{4}$/.test(id)) problems.push(`${where}: malformed Outcome ID "${id}"`);
  if (exact != null && exact !== exact.trim()) problems.push(`${where}: Exact Match "${exact}" has leading or trailing spaces`);
  if (!["Known", "Hidden gem"].includes(row.Recognition)) problems.push(`${where}: unexpected Recognition "${row.Recognition}"`);
  if (!["US", "International"].includes(row.Scope)) problems.push(`${where}: unexpected Scope "${row.Scope}"`);
  if (byId.has(id)) problems.push(`${where}: duplicate Outcome ID ${id} (also row ${byId.get(id).sheetRow})`);
  if (byExact.has(exact)) problems.push(`${where}: duplicate Exact Match "${exact}" (also row ${byExact.get(exact).sheetRow})`);
  byId.set(id, row);
  byExact.set(exact, row);
}

// --- Lodging Prices sheet ---
const LODGING_COLUMNS = ["Outcome ID", "Exact Match", "Price Tier", "Stay Option", "Price Basis", "Annual Avg / Night (USD)", "Typical Low (USD)", "Typical High (USD)", "Price Status"];
const lodgingRows = table("Lodging Prices", LODGING_COLUMNS);
const lodging = {};
for (const row of lodgingRows) {
  const where = `Lodging Prices row ${row.sheetRow}`;
  const outcome = byId.get(row["Outcome ID"]);
  if (!outcome) { problems.push(`${where}: Outcome ID ${row["Outcome ID"]} is not on the Destinations sheet`); continue; }
  if (outcome["Exact Match"] !== row["Exact Match"]) problems.push(`${where}: Exact Match "${row["Exact Match"]}" differs from the Destinations sheet ("${outcome["Exact Match"]}")`);
  const [average, low, high] = ["Annual Avg / Night (USD)", "Typical Low (USD)", "Typical High (USD)"].map((column) => Number(row[column]));
  if (![average, low, high].every((value) => Number.isFinite(value) && value > 0)) { problems.push(`${where}: prices must be positive numbers`); continue; }
  if (!(low <= average && average <= high)) problems.push(`${where}: expected low ≤ average ≤ high (${low}, ${average}, ${high})`);
  if (!["Budget", "Average", "Expensive", "Camping"].includes(row["Price Tier"])) problems.push(`${where}: unexpected Price Tier "${row["Price Tier"]}"`);
  (lodging[row["Outcome ID"]] ||= []).push({
    tier: row["Price Tier"],
    option: row["Stay Option"],
    basis: row["Price Basis"],
    averageNightly: average,
    typicalLow: low,
    typicalHigh: high,
    currency: "USD",
    unit: /dorm bed/i.test(row["Price Basis"]) ? "bed" : /campsite/i.test(row["Price Basis"]) ? "campsite" : "room",
    status: row["Price Status"],
  });
}
for (const id of byId.keys()) if (!lodging[id]) problems.push(`${id}: no Lodging Prices rows`);

// --- Link outcomes to existing destinations ---
const { destinations } = await import(new URL("app/data/destinations.js", root));
const overrides = JSON.parse(readFileSync(new URL("scripts/destinations/master-list-links.json", root), "utf8")).links;
const fold = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const COUNTRY_ALIASES = { czechia: "czech republic", turkiye: "turkey" };
const countryKey = (value) => COUNTRY_ALIASES[fold(value)] || fold(value);
const catalog = destinations.map((item) => ({ id: item.id || item.airport, city: fold(item.city), country: countryKey(item.country), aliases: (item.aliases || []).map(fold) }));
const knownIds = new Set(catalog.map((item) => item.id));
// Destinations added from this list (verified-batch-05) carry their Outcome ID.
const masterRecords = new Map((JSON.parse(readFileSync(new URL("scripts/destinations/verified-batch-05.json", root), "utf8")).records || []).map((record) => [record.outcomeId, record.id]));
function linkFor(row) {
  const own = masterRecords.get(row["Outcome ID"]);
  if (own && knownIds.has(own)) return { destinationId: own, linkedBy: "master_list_record" };
  if (Object.hasOwn(overrides, row["Outcome ID"])) return { destinationId: overrides[row["Outcome ID"]], linkedBy: "manual" };
  const names = [row.Destination, ...String(row.Destination).split(/ and |, /i)].map(fold).filter(Boolean);
  const countries = [countryKey(row.Country), ...String(row.Country).split(/ and /i).map(countryKey)];
  for (const name of names) {
    const hit = catalog.find((item) => (item.city === name || item.aliases.includes(name)) && countries.includes(item.country));
    if (hit) return { destinationId: hit.id, linkedBy: "name_and_country" };
  }
  return { destinationId: null, linkedBy: null };
}

const outcomes = destinationRows.map((row) => {
  const link = linkFor(row);
  if (link.destinationId && !knownIds.has(link.destinationId)) problems.push(`${row["Outcome ID"]}: linked destination ${link.destinationId} does not exist`);
  return {
    outcomeId: row["Outcome ID"],
    exactMatch: row["Exact Match"],
    destination: row.Destination,
    stateProvince: row["State / Province"] || null,
    country: row.Country,
    region: row.Region,
    destinationType: row["Destination Type"],
    recognition: row.Recognition,
    bestFor: String(row["Best For"] || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    scope: row.Scope,
    destinationId: link.destinationId,
    linkedBy: link.linkedBy,
  };
});
const linkedTwice = Object.entries(Object.groupBy(outcomes.filter((item) => item.destinationId), (item) => item.destinationId)).filter(([, items]) => items.length > 1);
for (const [id, items] of linkedTwice) problems.push(`${id} is linked from more than one outcome: ${items.map((item) => item.outcomeId).join(", ")}`);

const workbookChecked = statSync(workbookPath).mtime.toISOString().slice(0, 10);
const report = {
  workbook: workbookPath.split("/").pop(),
  workbookModified: workbookChecked,
  outcomes: outcomes.length,
  us: outcomes.filter((item) => item.scope === "US").length,
  international: outcomes.filter((item) => item.scope === "International").length,
  hiddenGems: outcomes.filter((item) => item.recognition === "Hidden gem").length,
  lodgingRows: lodgingRows.length,
  linkedToExisting: outcomes.filter((item) => item.destinationId).length,
  addedFromList: outcomes.filter((item) => item.linkedBy === "master_list_record").length,
  notInCatalogYet: outcomes.filter((item) => !item.destinationId).map((item) => item.outcomeId),
  problems,
};
writeFileSync(new URL("scripts/destinations/master-list-report.json", root), `${JSON.stringify(report, null, 2)}\n`);
if (problems.length) {
  console.error(`Import stopped: ${problems.length} problem(s). See scripts/destinations/master-list-report.json`);
  for (const problem of problems.slice(0, 40)) console.error(`  ${problem}`);
  process.exit(1);
}
writeFileSync(new URL("app/data/destinationOutcomes.json", root), `${JSON.stringify({ source: report.workbook, importedFrom: workbookChecked, outcomes }, null, 1)}\n`);
writeFileSync(new URL("app/data/lodgingPriceGuide.json", root), `${JSON.stringify({
  source: report.workbook,
  checkedAt: workbookChecked,
  method: "USD nightly planning estimates across a normal year. Dorm prices are per bed; hostel private rooms and hotels are per room; camping per campsite. Not live quotes or named-property prices.",
  byOutcome: lodging,
})}\n`);
// The workbook's lodging prices are regional bands (237 places share 37
// distinct rows), so the browser gets a small summary per destination with how
// many places share the same band; the full guide stays server-side.
const bandKey = (rows) => rows.map((row) => row.averageNightly).join(",");
const bandSize = Object.groupBy(Object.values(lodging), bandKey);
const pick = (rows, option) => rows.find((row) => row.option === option) || null;
const bands = Object.fromEntries(outcomes.filter((item) => item.destinationId).map((item) => {
  const rows = lodging[item.outcomeId];
  const value = (option) => pick(rows, option)?.averageNightly ?? null;
  const budget = pick(rows, "Well-reviewed budget hotel or guesthouse");
  return [item.destinationId, {
    outcomeId: item.outcomeId,
    dormBed: value("Highly rated hostel dorm"),
    budgetHotel: budget?.averageNightly ?? null,
    budgetHotelRange: budget ? [budget.typicalLow, budget.typicalHigh] : null,
    threeStar: value("Good-value three-star hotel"),
    fourStar: value("Upper-midscale four-star hotel"),
    luxury: value("Luxury five-star hotel or resort"),
    campsite: value("Established campground or basic campsite"),
    sharedBy: bandSize[bandKey(rows)].length,
  }];
}));
writeFileSync(new URL("app/data/lodgingPriceBands.json", root), `${JSON.stringify({ source: report.workbook, checkedAt: workbookChecked, bands })}\n`);

// Small index the site ships to the browser: destination id → outcome.
const index = Object.fromEntries(outcomes.filter((item) => item.destinationId).map((item) => [item.destinationId, [item.outcomeId, item.exactMatch, item.destinationType, item.scope]]));
writeFileSync(new URL("app/data/destinationOutcomeIndex.json", root), `${JSON.stringify(index)}\n`);
console.log(JSON.stringify({ ...report, notInCatalogYet: report.notInCatalogYet.length }, null, 2));
