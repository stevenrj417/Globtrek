import { readFile } from "node:fs/promises";
import { deriveTypicalPriceRange, validatePriceObservation } from "./catalog-tools.mjs";

const path = process.argv[2];
if (!path) throw new Error("Usage: node scripts/hotels/import-price-observations.mjs path/to/observations.json");
const payload = JSON.parse(await readFile(path, "utf8"));
const records = payload.records || payload;
const failures = records.map((record) => ({ record, errors: validatePriceObservation(record) })).filter((item) => item.errors.length);
const groups = Map.groupBy(records.filter((record) => validatePriceObservation(record).length === 0), (record) => record.hotelId);
const prices = [...groups].map(([hotelId, observations]) => ({ hotelId, ...deriveTypicalPriceRange(observations) }));
console.log(JSON.stringify({ submitted: records.length, validObservations: records.length - failures.length, invalidObservations: failures.length, priceReadyHotels: prices.filter((item) => item.ready).length, prices, failures }, null, 2));
if (failures.length) process.exitCode = 2;
