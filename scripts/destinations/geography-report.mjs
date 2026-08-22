import { writeFile } from "node:fs/promises";
import { destinations } from "../../app/data/destinations.js";

const groups = {
  "North America": {
    "United States": ["UNITED STATES"], "Canada": ["CANADA"],
  },
  "Latin America / Caribbean": {
    "Mexico": ["MEXICO"], "Central America": ["BELIZE", "COSTA RICA", "GUATEMALA", "HONDURAS", "PANAMA"],
    "Caribbean": ["BAHAMAS", "BARBADOS", "CUBA", "CURAÇAO", "DOMINICAN REPUBLIC", "JAMAICA", "PUERTO RICO"],
    "Northern South America": ["COLOMBIA", "VENEZUELA"], "Andean South America": ["BOLIVIA", "ECUADOR", "PERU"],
    "Southern South America": ["ARGENTINA", "ARGENTINA & CHILE", "CHILE", "URUGUAY"], "Brazil": ["BRAZIL"],
  },
  Europe: {
    "Western Europe": ["BELGIUM", "FRANCE", "LUXEMBOURG", "MONACO", "NETHERLANDS"],
    "Northern Europe": ["DENMARK", "ESTONIA", "FINLAND", "ICELAND", "IRELAND", "LATVIA", "NORWAY", "SWEDEN", "UNITED KINGDOM"],
    "Southern Europe": ["ALBANIA", "BOSNIA AND HERZEGOVINA", "CROATIA", "GREECE", "ITALY", "MONTENEGRO", "NORTH MACEDONIA", "PORTUGAL", "SERBIA", "SLOVENIA", "SPAIN"],
    "Central Europe": ["AUSTRIA", "CZECH REPUBLIC", "GERMANY", "HUNGARY", "POLAND", "SLOVAKIA", "SWITZERLAND"],
    "Eastern Europe": ["BULGARIA", "ROMANIA"],
  },
  Africa: {
    "North Africa": ["EGYPT", "MOROCCO", "TUNISIA"], "West Africa": ["GHANA", "NIGERIA", "SENEGAL"],
    "East Africa": ["ETHIOPIA", "KENYA", "MADAGASCAR", "MAURITIUS", "RWANDA", "SEYCHELLES", "TANZANIA"],
    "Central Africa": [], "Southern Africa": ["BOTSWANA", "NAMIBIA", "SOUTH AFRICA", "ZIMBABWE"],
  },
  "Middle East": {
    "Eastern Mediterranean": ["ISRAEL", "JORDAN", "LEBANON", "TURKEY"], "Arabian Peninsula": ["OMAN", "QATAR", "SAUDI ARABIA", "UNITED ARAB EMIRATES"],
  },
  Asia: {
    "East Asia": ["CHINA", "JAPAN", "SOUTH KOREA", "TAIWAN"], "Southeast Asia": ["CAMBODIA", "INDONESIA", "LAOS", "MALAYSIA", "PHILIPPINES", "SINGAPORE", "THAILAND", "VIETNAM"],
    "South Asia": ["INDIA", "MALDIVES"], "Central Asia / Caucasus": ["ARMENIA", "GEORGIA"],
  },
  "Oceania / Pacific": { Australia: ["AUSTRALIA"], "New Zealand": ["NEW ZEALAND"], "Pacific Islands": ["FRENCH POLYNESIA"] },
};

const lookup = new Map();
for (const [macro, subdivisions] of Object.entries(groups)) for (const [subregion, countries] of Object.entries(subdivisions)) for (const country of countries) lookup.set(country, { macro, subregion });
const unknown = [...new Set(destinations.map((item) => item.country).filter((country) => !lookup.has(country)))];
if (unknown.length) throw new Error(`Unmapped destination countries: ${unknown.join(", ")}`);
const count = (items) => ({ count: items.length, percentage: Number((items.length / destinations.length * 100).toFixed(1)) });
const macroregions = Object.fromEntries(Object.keys(groups).map((macro) => [macro, count(destinations.filter((item) => lookup.get(item.country).macro === macro))]));
const subregions = Object.fromEntries(Object.entries(groups).flatMap(([macro, subdivisions]) => Object.keys(subdivisions).map((subregion) => {
  const items = destinations.filter((item) => lookup.get(item.country).macro === macro && lookup.get(item.country).subregion === subregion);
  return [`${macro} — ${subregion}`, { ...count(items), countryCount: new Set(items.map((item) => item.country)).size }];
})));
const sameNames = Object.entries(Object.groupBy(destinations, (item) => item.city.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase())).filter(([, items]) => items.length > 1).map(([, items]) => items.map((item) => ({ destinationId: item.id || item.airport, name: item.city, country: item.country })));
const findings = {
  overrepresentation: Object.entries(macroregions).filter(([, value]) => value.percentage >= 35).map(([region]) => region),
  underrepresentation: Object.entries(macroregions).filter(([, value]) => value.percentage < 5).map(([region]) => region),
  zeroSubregions: Object.entries(subregions).filter(([, value]) => value.count === 0).map(([region]) => region),
  lowDiversitySubregions: Object.entries(subregions).filter(([region, value]) => value.count > 0 && value.countryCount <= 2 && !["United States", "Canada", "Mexico", "Brazil", "Australia", "New Zealand"].some((label) => region.endsWith(`— ${label}`))).map(([region, value]) => ({ region, destinations: value.count, countries: value.countryCount })),
  note: "Distribution findings are recommendations only; no destination membership was changed.",
};
const report = { generatedAt: new Date().toISOString(), destinations: destinations.length, macroregions, subregions, sameNormalizedNames: sameNames, findings };
await writeFile("scripts/destinations/geography-report.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
