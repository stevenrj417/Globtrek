// Intui.travel airport-transfer pages by country (public site, checked
// 2026-11-11 from https://en.intui.travel/transfer/). Live transfer prices need
// an approved Intui API key, which GlobTrek does not have, so GlobTrek links to
// the country page only and shows no transfer price from Intui.

export const INTUI_CHECKED = "2026-11-11";

const PAGES = {
  austria: "austria", australia: "australia", argentina: "argentina", aruba: "aruba", armenia: "armenia", "abu dhabi": "abu-dhabi",
  bulgaria: "bulgaria", belgium: "belgium", bahamas: "bahamas", indonesia: "bali", brazil: "brazil", bolivia: "bolivia", "bosnia and herzegovina": "bosnia-and-herzegovina",
  belize: "belize", botswana: "botswana", barbados: "barbados", "czech republic": "czech-republic", czechia: "czech-republic", croatia: "croatia", canada: "canada", china: "china",
  cambodia: "cambodia", chile: "chile", "costa rica": "costa_rica", cuba: "cuba", colombia: "colombia_en", curacao: "curacao", "curaçao": "curacao",
  "united arab emirates": "dubai", denmark: "denmark", "dominican republic": "dominican-republic", egypt: "egypt", estonia: "estonia", ecuador: "ecuador", ethiopia: "ethiopia",
  france: "france", finland: "finland", fiji: "fiji", "french polynesia": "french_polynesia", greece: "greece-cyprus", cyprus: "greece-cyprus", germany: "germany",
  georgia: "georgia", ghana: "ghana", guatemala: "guatemala", hungary: "hungary", netherlands: "holland", "hong kong": "hong-kong", honduras: "honduras",
  italy: "italy", ireland: "ireland", india: "india", iceland: "iceland", israel: "israel", jordan: "jordan", japan: "japan", jamaica: "jamaica",
  kenya: "kenya", luxembourg: "luxembourg", latvia: "latvia", lithuania: "lithuania", lebanon: "lebanon", laos: "laos", malta: "malta", mexico: "mexico",
  morocco: "morocco", montenegro: "montenegro", "north macedonia": "macedonia", malaysia: "malaysia", mauritius: "mauritius", madagascar: "madagascar", maldives: "maldives",
  nigeria: "nigeria", norway: "norway", "new zealand": "new-zealand", nepal: "nepal", namibia: "namibia", oman: "oman", portugal: "portugal", poland: "poland",
  "puerto rico": "puerto-rico", peru: "peru", philippines: "philippines", panama: "panama", qatar: "qatar", romania: "romania", rwanda: "rwanda", spain: "spain",
  switzerland: "switzerland", slovakia: "slovakia", slovenia: "slovenia", "sri lanka": "sri-lanka", sweden: "sweden", "south africa": "south-africa", singapore: "singapore",
  "saudi arabia": "saudi-arabia", "south korea": "south-korea", serbia: "serbia", seychelles: "seyshelles", "saint lucia": "saint-lucia", turkey: "turkey", "türkiye": "turkey",
  tunisia: "tunisia", thailand: "thailand", taiwan: "taiwan", tanzania: "tanzaniya", "united kingdom": "united-kingdom", "united states": "usa", uruguay: "urugvai_en",
  uzbekistan: "uzbekistan", vietnam: "vietnam", zimbabwe: "zimbabwe", zambia: "zambia",
};

export function intuiTransferPage(countryName) {
  const slug = PAGES[String(countryName || "").toLowerCase()];
  return slug ? `https://en.intui.travel/transfer/${slug}/` : null;
}
