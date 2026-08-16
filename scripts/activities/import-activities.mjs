import { readFile } from "node:fs/promises";
import { importActivityBatch } from "./catalog-tools.mjs";

const inputPath = process.argv[2];
const destinationPath = process.argv[3] || "scripts/destinations/verified-batch-01.json";
if (!inputPath) throw new Error("Usage: node scripts/activities/import-activities.mjs path/to/activities.json [destinations.json]");
const [input, destinationPayload] = await Promise.all([readFile(inputPath, "utf8"), readFile(destinationPath, "utf8")]);
const destinations = JSON.parse(destinationPayload).records || JSON.parse(destinationPayload);
const records = JSON.parse(input).records || JSON.parse(input);
const destinationIds = new Set(destinations.flatMap((item) => [item.id, item.nearestAirport]).filter(Boolean));
const report = importActivityBatch(records, destinationIds);
console.log(JSON.stringify(report, null, 2));
if (report.rejected) process.exitCode = 2;
