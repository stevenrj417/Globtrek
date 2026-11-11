// Official entry-requirement and travel-advisory pages per destination country.
// GOV.UK foreign travel advice: every URL below was fetched and returned 200 on
// TRAVEL_INFO_CHECKED. The U.S. State Department country page is offered as a
// second link for U.S. citizens; travel.state.gov sits behind a bot check, so
// those pages follow the State Department's published URL pattern but were not
// machine-verified.

export const TRAVEL_INFO_CHECKED = "2026-11-11";

const STATE = "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages";
const UK = "https://www.gov.uk/foreign-travel-advice";

const COUNTRIES = {
  MEXICO: { state: "Mexico", uk: "mexico" },
  PORTUGAL: { state: "Portugal", uk: "portugal" },
  VIETNAM: { state: "Vietnam", uk: "vietnam" },
  THAILAND: { state: "Thailand", uk: "thailand" },
  ARGENTINA: { state: "Argentina", uk: "argentina" },
  "ARGENTINA & CHILE": { state: "Argentina", uk: "argentina" },
  CHILE: { state: "Chile", uk: "chile" },
  POLAND: { state: "Poland", uk: "poland" },
  ROMANIA: { state: "Romania", uk: "romania" },
  GEORGIA: { state: "Georgia", uk: "georgia" },
  NEPAL: { state: "Nepal", uk: "nepal" },
  SLOVENIA: { state: "Slovenia", uk: "slovenia" },
  AUSTRIA: { state: "Austria", uk: "austria" },
  ITALY: { state: "Italy", uk: "italy" },
  FRANCE: { state: "France", uk: "france" },
  SWITZERLAND: { state: "Switzerland", uk: "switzerland" },
  CANADA: { state: "Canada", uk: "canada" },
  JAPAN: { state: "Japan", uk: "japan" },
  SPAIN: { state: "Spain", uk: "spain" },
  GREECE: { state: "Greece", uk: "greece" },
  // Added 2026-11-12; each GOV.UK advice and entry page returned 200 that day.
  "SOUTH KOREA": { uk: "south-korea", name: "South Korea" },
  "INDONESIA": { state: "Indonesia", uk: "indonesia", name: "Indonesia" },
  "SINGAPORE": { state: "Singapore", uk: "singapore", name: "Singapore" },
  "MALDIVES": { state: "Maldives", uk: "maldives", name: "Maldives" },
  "UNITED ARAB EMIRATES": { uk: "united-arab-emirates", name: "United Arab Emirates" },
  "SOUTH AFRICA": { uk: "south-africa", name: "South Africa" },
  "MOROCCO": { state: "Morocco", uk: "morocco", name: "Morocco" },
  "KENYA": { state: "Kenya", uk: "kenya", name: "Kenya" },
  "ICELAND": { state: "Iceland", uk: "iceland", name: "Iceland" },
  "COSTA RICA": { uk: "costa-rica", name: "Costa Rica" },
  "BRAZIL": { state: "Brazil", uk: "brazil", name: "Brazil" },
  "AUSTRALIA": { state: "Australia", uk: "australia", name: "Australia" },
  "NEW ZEALAND": { uk: "new-zealand", name: "New Zealand" },
  "FRENCH POLYNESIA": { uk: "french-polynesia", name: "French Polynesia" },
  "MONTENEGRO": { state: "Montenegro", uk: "montenegro", name: "Montenegro" },
  "ALBANIA": { state: "Albania", uk: "albania", name: "Albania" },
  "NORWAY": { state: "Norway", uk: "norway", name: "Norway" },
  "SWEDEN": { state: "Sweden", uk: "sweden", name: "Sweden" },
  "LATVIA": { state: "Latvia", uk: "latvia", name: "Latvia" },
  "CZECH REPUBLIC": { uk: "czechia", name: "Czech Republic" },
  "PHILIPPINES": { state: "Philippines", uk: "philippines", name: "Philippines" },
  "URUGUAY": { state: "Uruguay", uk: "uruguay", name: "Uruguay" },
  "CROATIA": { state: "Croatia", uk: "croatia", name: "Croatia" },
  "BELGIUM": { state: "Belgium", uk: "belgium", name: "Belgium" },
  "NETHERLANDS": { state: "Netherlands", uk: "netherlands", name: "Netherlands" },
  "MALAYSIA": { state: "Malaysia", uk: "malaysia", name: "Malaysia" },
  "PERU": { state: "Peru", uk: "peru", name: "Peru" },
  "COLOMBIA": { state: "Colombia", uk: "colombia", name: "Colombia" },
  "TAIWAN": { state: "Taiwan", uk: "taiwan", name: "Taiwan" },
  "LAOS": { state: "Laos", uk: "laos", name: "Laos" },
  "DENMARK": { state: "Denmark", uk: "denmark", name: "Denmark" },
  "IRELAND": { state: "Ireland", uk: "ireland", name: "Ireland" },
  "TURKEY": { state: "Turkey", uk: "turkey", name: "Turkey" },
  "CHINA": { state: "China", uk: "china", name: "China" },
  "GERMANY": { state: "Germany", uk: "germany", name: "Germany" },
  "BULGARIA": { state: "Bulgaria", uk: "bulgaria", name: "Bulgaria" },
  "NORTH MACEDONIA": { uk: "north-macedonia", name: "North Macedonia" },
  "ARMENIA": { state: "Armenia", uk: "armenia", name: "Armenia" },
  "BOSNIA AND HERZEGOVINA": { uk: "bosnia-and-herzegovina", name: "Bosnia and Herzegovina" },
  "ESTONIA": { state: "Estonia", uk: "estonia", name: "Estonia" },
  "SEYCHELLES": { state: "Seychelles", uk: "seychelles", name: "Seychelles" },
  "CAMBODIA": { state: "Cambodia", uk: "cambodia", name: "Cambodia" },
  "MONACO": { state: "Monaco", uk: "monaco", name: "Monaco" },
  "HUNGARY": { state: "Hungary", uk: "hungary", name: "Hungary" },
  "EGYPT": { state: "Egypt", uk: "egypt", name: "Egypt" },
  "QATAR": { state: "Qatar", uk: "qatar", name: "Qatar" },
  "INDIA": { state: "India", uk: "india", name: "India" },
  "ISRAEL": { state: "Israel", uk: "israel", name: "Israel" },
  "GUATEMALA": { state: "Guatemala", uk: "guatemala", name: "Guatemala" },
  "BELIZE": { state: "Belize", uk: "belize", name: "Belize" },
  "PANAMA": { state: "Panama", uk: "panama", name: "Panama" },
  "HONDURAS": { state: "Honduras", uk: "honduras", name: "Honduras" },
  "CUBA": { state: "Cuba", uk: "cuba", name: "Cuba" },
  "DOMINICAN REPUBLIC": { uk: "dominican-republic", name: "Dominican Republic" },
  "JAMAICA": { state: "Jamaica", uk: "jamaica", name: "Jamaica" },
  "BAHAMAS": { state: "Bahamas", uk: "bahamas", name: "Bahamas" },
  "CURA\u00c7AO": { uk: "curacao", name: "Curaçao" },
  "BARBADOS": { state: "Barbados", uk: "barbados", name: "Barbados" },
  "ECUADOR": { state: "Ecuador", uk: "ecuador", name: "Ecuador" },
  "BOLIVIA": { state: "Bolivia", uk: "bolivia", name: "Bolivia" },
  "FINLAND": { state: "Finland", uk: "finland", name: "Finland" },
  "LUXEMBOURG": { state: "Luxembourg", uk: "luxembourg", name: "Luxembourg" },
  "SERBIA": { state: "Serbia", uk: "serbia", name: "Serbia" },
  "SLOVAKIA": { state: "Slovakia", uk: "slovakia", name: "Slovakia" },
  "LEBANON": { state: "Lebanon", uk: "lebanon", name: "Lebanon" },
  "JORDAN": { state: "Jordan", uk: "jordan", name: "Jordan" },
  "OMAN": { state: "Oman", uk: "oman", name: "Oman" },
  "SAUDI ARABIA": { uk: "saudi-arabia", name: "Saudi Arabia" },
  "TUNISIA": { state: "Tunisia", uk: "tunisia", name: "Tunisia" },
  "SENEGAL": { state: "Senegal", uk: "senegal", name: "Senegal" },
  "GHANA": { state: "Ghana", uk: "ghana", name: "Ghana" },
  "NIGERIA": { state: "Nigeria", uk: "nigeria", name: "Nigeria" },
  "ETHIOPIA": { state: "Ethiopia", uk: "ethiopia", name: "Ethiopia" },
  "TANZANIA": { state: "Tanzania", uk: "tanzania", name: "Tanzania" },
  "RWANDA": { state: "Rwanda", uk: "rwanda", name: "Rwanda" },
  "ZIMBABWE": { state: "Zimbabwe", uk: "zimbabwe", name: "Zimbabwe" },
  "NAMIBIA": { state: "Namibia", uk: "namibia", name: "Namibia" },
  "BOTSWANA": { state: "Botswana", uk: "botswana", name: "Botswana" },
  "MAURITIUS": { state: "Mauritius", uk: "mauritius", name: "Mauritius" },
  "MADAGASCAR": { state: "Madagascar", uk: "madagascar", name: "Madagascar" },
};

export function travelInfoFor(country) {
  const key = String(country || "").toUpperCase();
  // The UK publishes no travel advice about itself; visitors get its visa and visitor pages.
  if (key === "UNITED KINGDOM") return { domestic: false, entryUrl: "https://www.gov.uk/check-uk-visa", entryLabel: "United Kingdom: check if you need a visa (GOV.UK)", advisoryUrl: "https://www.gov.uk/standard-visitor", advisoryLabel: "United Kingdom: visiting as a tourist (GOV.UK)", usCitizensUrl: null, usCitizensLabel: null };
  const item = key === "UNITED STATES" || key === "PUERTO RICO" ? { state: null, uk: "usa", name: key === "PUERTO RICO" ? "Puerto Rico" : "United States" } : COUNTRIES[key];
  if (!item) return null;
  const name = item.name || item.state;
  return {
    domestic: key === "UNITED STATES" || key === "PUERTO RICO",
    entryUrl: `${UK}/${item.uk}/entry-requirements`,
    entryLabel: `${name}: entry requirements (GOV.UK)`,
    advisoryUrl: `${UK}/${item.uk}`,
    advisoryLabel: `${name}: safety and travel advice (GOV.UK)`,
    usCitizensUrl: item.state ? `${STATE}/${item.state}.html` : null,
    usCitizensLabel: item.state ? `${name}: U.S. State Department country page` : null,
  };
}

export const TRAVEL_INFO_URLS = [...Object.keys(COUNTRIES), "UNITED STATES", "UNITED KINGDOM"].flatMap((country) => {
  const info = travelInfoFor(country);
  return [info.entryUrl, info.advisoryUrl];
});
