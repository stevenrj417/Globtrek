import { readFile, writeFile } from "node:fs/promises";

const output = process.argv[2] || "scripts/hotels/web-evidence-classifications.json";
const inputs = process.argv.slice(3);
if (!inputs.length) throw new Error("Provide at least one web-evidence artifact to merge");
const reports = await Promise.all(inputs.map(async (path) => JSON.parse(await readFile(path, "utf8"))));
const records = [...new Map(reports.flatMap((report) => report.records || []).map((item) => [item.googlePlaceId, item])).values()];
const failures = [...new Map(reports.flatMap((report) => report.failures || []).map((item) => [`${item.googlePlaceId}:${item.error}`, item])).values()].filter((item) => !records.some((record) => record.googlePlaceId === item.googlePlaceId));
const report = { generatedAt: new Date().toISOString(), records, failures };
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output, records: records.length, failures: failures.length }, null, 2));
