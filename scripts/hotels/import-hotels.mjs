import { readFile } from "node:fs/promises";
import { destinations } from "../../app/data/destinations.js";
import { importBatch } from "./catalog-tools.mjs";

function parseCsv(text) {
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { field += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && text[index + 1] === "\n") index += 1; row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = ""; }
    else field += char;
  }
  row.push(field); if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), values[index]?.trim() || ""])));
}

const path = process.argv[2];
if (!path) throw new Error("Usage: npm run hotels:import -- path/to/hotels.json|csv");
const text = await readFile(path, "utf8");
const records = path.endsWith(".csv") ? parseCsv(text) : JSON.parse(text);
const report = importBatch(records, destinations);
console.log(JSON.stringify(report, null, 2));
if (report.invalid || report.duplicates) process.exitCode = 2;
