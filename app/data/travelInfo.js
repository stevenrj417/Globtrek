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
};

export function travelInfoFor(country) {
  const key = String(country || "").toUpperCase();
  const item = key === "UNITED STATES" ? { state: null, uk: "usa", name: "United States" } : COUNTRIES[key];
  if (!item) return null;
  const name = item.name || item.state;
  return {
    domestic: key === "UNITED STATES",
    entryUrl: `${UK}/${item.uk}/entry-requirements`,
    entryLabel: `${name}: entry requirements (GOV.UK)`,
    advisoryUrl: `${UK}/${item.uk}`,
    advisoryLabel: `${name}: safety and travel advice (GOV.UK)`,
    usCitizensUrl: item.state ? `${STATE}/${item.state}.html` : null,
    usCitizensLabel: item.state ? `${name}: U.S. State Department country page` : null,
  };
}

export const TRAVEL_INFO_URLS = [...Object.keys(COUNTRIES), "UNITED STATES"].flatMap((country) => {
  const info = travelInfoFor(country);
  return [info.entryUrl, info.advisoryUrl];
});
