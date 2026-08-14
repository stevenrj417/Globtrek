import { readFile } from "node:fs/promises";
import { destinationCoverageReport } from "./catalog-tools.mjs";

const paths = process.argv.slice(2);
const destinationPayload = JSON.parse(await readFile(paths[0] || "scripts/destinations/verified-batch-01.json", "utf8"));
const hotels = paths[1] ? JSON.parse(await readFile(paths[1], "utf8")) : [];
const activities = paths[2] ? JSON.parse(await readFile(paths[2], "utf8")) : [];
console.log(JSON.stringify(destinationCoverageReport(destinationPayload.records || destinationPayload, hotels.records || hotels, activities.records || activities), null, 2));
