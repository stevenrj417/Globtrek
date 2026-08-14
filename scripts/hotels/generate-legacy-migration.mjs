import { writeFile } from "node:fs/promises";
import { destinations } from "../../app/data/destinations.js";
import { hotelCatalog } from "../../app/data/hotels.js";
import { destinationCostProfile } from "../../app/lib/recommendation/costProfiles.js";
import { importBatch } from "./catalog-tools.mjs";

const quote = (value) => value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => `${quote(JSON.stringify(value))}::jsonb`;
const array = (values) => values?.length ? `array[${values.map(quote).join(",")}]::text[]` : "'{}'::text[]";

const records = destinations.flatMap((destination) => (hotelCatalog[destination.city] || []).map((hotel) => ({ ...(typeof hotel === "string" ? { name: hotel } : hotel), destinationId: destination.airport })));
const report = importBatch(records, destinations);
if (report.invalid || report.duplicates) throw new Error(`Legacy catalog is not clean: ${report.invalid} invalid, ${report.duplicates} duplicate`);

const destinationSql = destinations.map((destination) => {
  const profile = destinationCostProfile(destination);
  return `(${quote(destination.airport)},${quote(destination.city)},${quote(destination.country)},'USD',${destination.recognition},${json(profile)},${quote(profile.source)},${profile.confidence},${quote(profile.lastUpdated)})`;
}).join(",\n");

const hotelSql = report.records.map((hotel) => `(${quote(hotel.destinationId)},${quote(hotel.name)},${quote(hotel.normalizedName)},${quote(hotel.city)},${quote(hotel.country)},${quote(hotel.bookingComPropertyUrl)},${quote(hotel.cjTrackingUrl)},${quote(hotel.provider)},${quote(hotel.providerPropertyId)},${array(hotel.styleTags)},${quote(hotel.verificationSource)},${quote(hotel.reviewStatus)},${hotel.active})`).join(",\n");

const sql = `-- Generated from the existing curated frontend catalog. No new hotel facts are invented here.\ninsert into public.travel_destinations (id,city,country,currency,recognition_score,cost_profile,cost_source,cost_confidence,cost_last_updated) values\n${destinationSql}\non conflict (id) do update set recognition_score=excluded.recognition_score,cost_profile=excluded.cost_profile,cost_source=excluded.cost_source,cost_confidence=excluded.cost_confidence,cost_last_updated=excluded.cost_last_updated,updated_at=now();\n\ninsert into public.hotel_catalog (destination_id,name,normalized_name,city,country,booking_com_property_url,cj_tracking_url,provider,provider_property_id,style_tags,verification_source,review_status,active) values\n${hotelSql}\non conflict (destination_id,normalized_name,provider) do update set booking_com_property_url=excluded.booking_com_property_url,cj_tracking_url=excluded.cj_tracking_url,provider_property_id=excluded.provider_property_id,style_tags=excluded.style_tags,updated_at=now();\n`;

await writeFile(new URL("../../supabase/migrations/202608140002_seed_legacy_catalog.sql", import.meta.url), sql);
console.log(JSON.stringify({ destinations: destinations.length, hotels: report.imported, output: "supabase/migrations/202608140002_seed_legacy_catalog.sql" }));
