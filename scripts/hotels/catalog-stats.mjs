import { destinations } from "../../app/data/destinations.js";
import { hotelCatalog } from "../../app/data/hotels.js";
import { importBatch } from "./catalog-tools.mjs";

const records = destinations.flatMap((destination) => (hotelCatalog[destination.city] || []).map((hotel) => ({ ...(typeof hotel === "string" ? { name: hotel } : hotel), destinationId: destination.airport })));
const report = importBatch(records, destinations);
const missingPricing = report.records.filter((item) => item.typicalNightlyLow == null || item.typicalNightlyHigh == null).length;
const missingImages = report.records.filter((item) => !item.imageUrl).length;
const missingEnrichment = report.records.filter((item) => !item.description && item.styleTags.length === 0).length;
const staleVerification = report.records.filter((item) => !item.verifiedAt || Date.now() - Date.parse(item.verifiedAt) > 180 * 86400000).length;
console.log(JSON.stringify({ totalHotels: report.imported, destinationsCovered: new Set(report.records.map((item) => item.destinationId)).size, duplicates: report.duplicates, invalid: report.invalid, missingPricing, missingImages, missingEnrichment, staleVerification }, null, 2));
