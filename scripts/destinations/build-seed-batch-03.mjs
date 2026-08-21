import { writeFile } from "node:fs/promises";
import { destinations } from "../../app/data/destinations.js";

const rows = `
Portland|United States|Oregon|PDX|Portland, Oregon|city,nature,food
Savannah|United States|Georgia|SAV|Savannah, Georgia|history,food,architecture
Charleston|United States|South Carolina|CHS|Charleston, South Carolina|history,food,coast
New Orleans|United States|Louisiana|MSY|New Orleans|food,music,nightlife
Austin|United States|Texas|AUS|Austin, Texas|food,music,nightlife
Santa Fe|United States|New Mexico|SAF|Santa Fe, New Mexico|art,design,history
Sedona|United States|Arizona|FLG|Sedona, Arizona|nature,wellness,hiking
Nashville|United States|Tennessee|BNA|Nashville, Tennessee|music,food,nightlife
San Diego|United States|California|SAN|San Diego|beaches,food,family
Palm Springs|United States|California|PSP|Palm Springs, California|design,wellness,desert
Anchorage|United States|Alaska|ANC|Anchorage, Alaska|nature,wildlife,hiking
Honolulu|United States|Hawaii|HNL|Honolulu|beaches,food,culture
Quebec City|Canada|Quebec|YQB|Quebec City|culture,food,architecture
Halifax|Canada|Nova Scotia|YHZ|Halifax, Nova Scotia|coast,food,history
Victoria|Canada|British Columbia|YYJ|Victoria, British Columbia|coast,gardens,food
Calgary|Canada|Alberta|YYC|Calgary|city,nature,food
Ottawa|Canada|Ontario|YOW|Ottawa|museums,history,food
Winnipeg|Canada|Manitoba|YWG|Winnipeg|culture,food,architecture
Merida|Mexico|Yucatán|MID|Mérida, Yucatán|food,culture,architecture
San Miguel de Allende|Mexico|Guanajuato|BJX|San Miguel de Allende|art,food,architecture
Guadalajara|Mexico|Jalisco|GDL|Guadalajara|food,culture,nightlife
Puerto Vallarta|Mexico|Jalisco|PVR|Puerto Vallarta|beaches,food,nightlife
La Paz|Mexico|Baja California Sur|LAP|La Paz, Baja California Sur|beaches,nature,water
Guanajuato City|Mexico|Guanajuato|BJX|Guanajuato City|culture,architecture,food
Antigua Guatemala|Guatemala|Sacatepéquez|GUA|Antigua Guatemala|culture,architecture,food
Belize City|Belize|Belize District|BZE|Belize City|coast,culture,nature
Panama City|Panama|Panamá Province|PTY|Panama City|city,food,architecture
Roatán|Honduras|Bay Islands|RTB|Roatán|beaches,diving,nature
Havana|Cuba|La Habana|HAV|Havana|culture,architecture,music
Santo Domingo|Dominican Republic|Distrito Nacional|SDQ|Santo Domingo|history,food,nightlife
San Juan|Puerto Rico|Puerto Rico|SJU|San Juan, Puerto Rico|beaches,food,history
Montego Bay|Jamaica|Saint James|MBJ|Montego Bay|beaches,music,relaxation
Nassau|Bahamas|New Providence|NAS|Nassau, Bahamas|beaches,water,relaxation
Oranjestad|Aruba|Aruba|AUA|Oranjestad, Aruba|beaches,food,water
Willemstad|Curaçao|Curaçao|CUR|Willemstad|beaches,architecture,food
Bridgetown|Barbados|Saint Michael|BGI|Bridgetown|beaches,history,food
Bogotá|Colombia|Cundinamarca|BOG|Bogotá|food,art,culture
Santa Marta|Colombia|Magdalena|SMR|Santa Marta|beaches,nature,history
Quito|Ecuador|Pichincha|UIO|Quito|culture,architecture,mountains
Galápagos Islands|Ecuador|Galápagos|GPS|Galápagos Islands|wildlife,nature,water
La Paz|Bolivia|La Paz Department|LPB|La Paz|culture,mountains,food
Uyuni|Bolivia|Potosí Department|UYU|Uyuni|nature,photography,adventure
Santiago|Chile|Santiago Metropolitan Region|SCL|Santiago|food,culture,mountains
Valparaíso|Chile|Valparaíso Region|SCL|Valparaíso|art,coast,architecture
Atacama Desert|Chile|Antofagasta Region|CJC|Atacama Desert|desert,stargazing,adventure
Mendoza|Argentina|Mendoza Province|MDZ|Mendoza, Argentina|food,wine,mountains
Bariloche|Argentina|Río Negro|BRC|Bariloche|mountains,lakes,food
Montevideo|Uruguay|Montevideo Department|MVD|Montevideo|food,coast,culture
Punta del Este|Uruguay|Maldonado Department|PDP|Punta del Este|beaches,nightlife,design
São Paulo|Brazil|São Paulo|GRU|São Paulo|food,art,nightlife
Salvador|Brazil|Bahia|SSA|Salvador, Bahia|culture,food,beaches
Florianópolis|Brazil|Santa Catarina|FLN|Florianópolis|beaches,nature,nightlife
Manaus|Brazil|Amazonas|MAO|Manaus|nature,wildlife,culture
Recife|Brazil|Pernambuco|REC|Recife|beaches,culture,food
Cartago|Costa Rica|Cartago Province|SJO|Cartago, Costa Rica|nature,history,mountains
Reykjavík|Iceland|Capital Region|KEF|Reykjavík|design,food,nature
Oslo|Norway|Eastern Norway|OSL|Oslo|design,food,nature
Bergen|Norway|Vestland|BGO|Bergen|coast,nature,food
Tromsø|Norway|Troms|TOS|Tromsø|winter,nature,adventure
Helsinki|Finland|Uusimaa|HEL|Helsinki|design,food,architecture
Rovaniemi|Finland|Lapland|RVN|Rovaniemi|winter,nature,family
Gothenburg|Sweden|Västra Götaland|GOT|Gothenburg|food,design,coast
Aarhus|Denmark|Central Denmark|AAR|Aarhus|design,food,culture
Hamburg|Germany|Hamburg|HAM|Hamburg|food,architecture,nightlife
Cologne|Germany|North Rhine-Westphalia|CGN|Cologne|culture,food,architecture
Frankfurt|Germany|Hesse|FRA|Frankfurt|city,food,museums
Leipzig|Germany|Saxony|LEJ|Leipzig|art,music,nightlife
Dresden|Germany|Saxony|DRS|Dresden|art,architecture,history
Bruges|Belgium|West Flanders|BRU|Bruges|architecture,food,romance
Luxembourg City|Luxembourg|Luxembourg|LUX|Luxembourg City|architecture,food,history
Rotterdam|Netherlands|South Holland|RTM|Rotterdam|design,architecture,food
The Hague|Netherlands|South Holland|AMS|The Hague|art,coast,architecture
Cork|Ireland|County Cork|ORK|Cork (city)|food,culture,coast
Galway|Ireland|County Galway|SNN|Galway|music,food,coast
Manchester|United Kingdom|England|MAN|Manchester|music,food,culture
Liverpool|United Kingdom|England|LPL|Liverpool|music,culture,nightlife
Bath|United Kingdom|England|BRS|Bath, Somerset|architecture,history,wellness
Oxford|United Kingdom|England|LHR|Oxford|architecture,culture,history
Cambridge|United Kingdom|England|STN|Cambridge|architecture,culture,history
Brighton|United Kingdom|England|LGW|Brighton|coast,nightlife,food
Porto Santo|Portugal|Madeira|PXO|Porto Santo Island|beaches,relaxation,nature
Faro|Portugal|Algarve|FAO|Faro, Portugal|coast,food,history
Coimbra|Portugal|Centro|OPO|Coimbra|history,culture,architecture
Madrid|Spain|Community of Madrid|MAD|Madrid|art,food,nightlife
Málaga|Spain|Andalusia|AGP|Málaga|beaches,art,food
Córdoba|Spain|Andalusia|SVQ|Córdoba, Spain|history,architecture,food
Ibiza|Spain|Balearic Islands|IBZ|Ibiza|beaches,nightlife,wellness
Tenerife|Spain|Canary Islands|TFS|Tenerife|beaches,nature,hiking
Lanzarote|Spain|Canary Islands|ACE|Lanzarote|nature,design,beaches
Nice|France|Provence-Alpes-Côte d’Azur|NCE|Nice|coast,food,art
Toulouse|France|Occitania|TLS|Toulouse|food,architecture,culture
Montpellier|France|Occitania|MPL|Montpellier|food,architecture,coast
Chamonix|France|Auvergne-Rhône-Alpes|GVA|Chamonix|mountains,hiking,winter
Normandy|France|Normandy|CDG|Normandy|history,food,coast
Milan|Italy|Lombardy|MXP|Milan|design,food,shopping
Verona|Italy|Veneto|VRN|Verona|architecture,food,romance
Siena|Italy|Tuscany|FLR|Siena|history,food,architecture
Matera|Italy|Basilicata|BRI|Matera|history,architecture,food
Catania|Italy|Sicily|CTA|Catania|food,culture,nature
Sardinia|Italy|Sardinia|CAG|Sardinia|beaches,food,nature
Mykonos|Greece|Cyclades|JMK|Mykonos|beaches,nightlife,luxury
Crete|Greece|Crete|HER|Crete|beaches,food,history
Thessaloniki|Greece|Central Macedonia|SKG|Thessaloniki|food,history,nightlife
Meteora|Greece|Thessaly|SKG|Meteora|nature,history,hiking
Split|Croatia|Split-Dalmatia County|SPU|Split, Croatia|coast,history,nightlife
Hvar|Croatia|Split-Dalmatia County|SPU|Hvar|beaches,nightlife,food
Zagreb|Croatia|City of Zagreb|ZAG|Zagreb|food,culture,architecture
Belgrade|Serbia|Belgrade|BEG|Belgrade|food,nightlife,culture
Sofia|Bulgaria|Sofia City|SOF|Sofia|food,history,mountains
Bucharest|Romania|Bucharest|OTP|Bucharest|food,architecture,nightlife
Kraków|Poland|Lesser Poland|KRK|Kraków|history,food,architecture
Gdańsk|Poland|Pomeranian Voivodeship|GDN|Gdańsk|coast,history,architecture
Vilnius|Lithuania|Vilnius County|VNO|Vilnius|architecture,food,culture
Geneva|Switzerland|Geneva|GVA|Geneva|food,lakes,luxury
Lucerne|Switzerland|Lucerne|ZRH|Lucerne|lakes,mountains,architecture
Interlaken|Switzerland|Bern|ZRH|Interlaken|mountains,adventure,nature
Zermatt|Switzerland|Valais|GVA|Zermatt|mountains,winter,luxury
Hallstatt|Austria|Upper Austria|SZG|Hallstatt|lakes,mountains,photography
Bratislava|Slovakia|Bratislava Region|BTS|Bratislava|history,food,architecture
Eger|Hungary|Heves County|BUD|Eger|food,wine,history
Ljubljana|Slovenia|Central Slovenia|LJU|Ljubljana|food,architecture,nature
Ankara|Turkey|Central Anatolia|ESB|Ankara|history,food,culture
Cappadocia|Turkey|Central Anatolia|NAV|Cappadocia|nature,history,adventure
Izmir|Turkey|Aegean Region|ADB|İzmir|coast,food,history
Beirut|Lebanon|Beirut|BEY|Beirut|food,history,nightlife
Amman|Jordan|Amman Governorate|AMM|Amman|food,history,culture
Petra|Jordan|Ma'an Governorate|AQJ|Petra|history,adventure,photography
Muscat|Oman|Muscat Governorate|MCT|Muscat|coast,culture,nature
Tel Aviv|Israel|Tel Aviv District|TLV|Tel Aviv|beaches,food,nightlife
AlUla|Saudi Arabia|Medina Province|ULH|Al-'Ula|history,desert,adventure
Marrakesh|Morocco|Marrakesh-Safi|RAK|Marrakesh|food,design,culture
Fes|Morocco|Fès-Meknès|FEZ|Fes|history,food,architecture
Chefchaouen|Morocco|Tanger-Tetouan-Al Hoceima|TNG|Chefchaouen|architecture,culture,photography
Tangier|Morocco|Tanger-Tetouan-Al Hoceima|TNG|Tangier|coast,culture,food
Tunis|Tunisia|Tunis Governorate|TUN|Tunis|history,food,architecture
Luxor|Egypt|Luxor Governorate|LXR|Luxor|history,culture,adventure
Aswan|Egypt|Aswan Governorate|ASW|Aswan|history,nature,culture
Dakar|Senegal|Dakar Region|DSS|Dakar|food,music,coast
Accra|Ghana|Greater Accra|ACC|Accra|food,culture,nightlife
Lagos|Nigeria|Lagos State|LOS|Lagos|food,art,nightlife
Addis Ababa|Ethiopia|Addis Ababa|ADD|Addis Ababa|food,culture,history
Zanzibar City|Tanzania|Zanzibar|ZNZ|Zanzibar City|beaches,history,food
Serengeti National Park|Tanzania|Mara Region|JRO|Serengeti National Park|wildlife,nature,adventure
Kigali|Rwanda|Kigali|KGL|Kigali|food,culture,nature
Victoria Falls|Zimbabwe|Matabeleland North|VFA|Victoria Falls|nature,adventure,wildlife
Windhoek|Namibia|Khomas Region|WDH|Windhoek|culture,nature,adventure
Sossusvlei|Namibia|Hardap Region|WDH|Sossusvlei|desert,photography,nature
Johannesburg|South Africa|Gauteng|JNB|Johannesburg|art,food,history
Durban|South Africa|KwaZulu-Natal|DUR|Durban|beaches,food,culture
Gaborone|Botswana|South-East District|GBE|Gaborone|culture,nature,food
Mauritius|Mauritius|Indian Ocean|MRU|Mauritius|beaches,food,nature
Nosy Be|Madagascar|Diana Region|NOS|Nosy Be|beaches,nature,water
Delhi|India|Delhi|DEL|Delhi|food,history,culture
Jaipur|India|Rajasthan|JAI|Jaipur|history,design,food
Udaipur|India|Rajasthan|UDR|Udaipur|lakes,history,romance
Agra|India|Uttar Pradesh|AGR|Agra|history,architecture,culture
Goa|India|Goa|GOI|Goa|beaches,food,nightlife
Kochi|India|Kerala|COK|Kochi|food,history,water
Varanasi|India|Uttar Pradesh|VNS|Varanasi|culture,history,photography
Kathmandu|Nepal|Bagmati Province|KTM|Kathmandu|culture,mountains,history
Pokhara|Nepal|Gandaki Province|PKR|Pokhara|mountains,nature,adventure
Thimphu|Bhutan|Thimphu District|PBH|Thimphu|culture,mountains,nature
Colombo|Sri Lanka|Western Province|CMB|Colombo|food,culture,coast
Galle|Sri Lanka|Southern Province|CMB|Galle|coast,history,food
Dhaka|Bangladesh|Dhaka Division|DAC|Dhaka|food,culture,history
Karachi|Pakistan|Sindh|KHI|Karachi|food,culture,coast
Lahore|Pakistan|Punjab|LHE|Lahore|food,history,architecture
Samarkand|Uzbekistan|Samarqand Region|SKD|Samarkand|history,architecture,food
Bukhara|Uzbekistan|Bukhara Region|BHK|Bukhara|history,architecture,food
Almaty|Kazakhstan|Almaty|ALA|Almaty|food,mountains,culture
Bishkek|Kyrgyzstan|Chüy Region|FRU|Bishkek|food,mountains,culture
Ulaanbaatar|Mongolia|Ulaanbaatar|UBN|Ulaanbaatar|culture,food,adventure
Ho Chi Minh City|Vietnam|Southeast|SGN|Ho Chi Minh City|food,history,nightlife
Hoi An|Vietnam|Quảng Nam|DAD|Hội An|food,architecture,beaches
Nha Trang|Vietnam|Khánh Hòa|CXR|Nha Trang|beaches,food,nightlife
Phnom Penh|Cambodia|Phnom Penh|PNH|Phnom Penh|food,history,culture
Vientiane|Laos|Vientiane Prefecture|VTE|Vientiane|food,culture,history
Koh Samui|Thailand|Surat Thani|USM|Ko Samui|beaches,wellness,food
Krabi|Thailand|Krabi Province|KBV|Krabi|beaches,nature,adventure
Yangon|Myanmar|Yangon Region|RGN|Yangon|food,history,culture
Kuala Lumpur|Malaysia|Federal Territory|KUL|Kuala Lumpur|food,design,shopping
Langkawi|Malaysia|Kedah|LGK|Langkawi|beaches,nature,relaxation
George Town|Malaysia|Penang|PEN|George Town, Penang|food,architecture,culture
Jakarta|Indonesia|Jakarta|CGK|Jakarta|food,nightlife,culture
Yogyakarta|Indonesia|Special Region of Yogyakarta|YIA|Yogyakarta|culture,food,history
Lombok|Indonesia|West Nusa Tenggara|LOP|Lombok|beaches,nature,adventure
Komodo National Park|Indonesia|East Nusa Tenggara|LBJ|Komodo National Park|wildlife,nature,adventure
Manila|Philippines|Metro Manila|MNL|Manila|food,history,nightlife
Cebu City|Philippines|Central Visayas|CEB|Cebu City|food,history,beaches
Palawan|Philippines|Mimaropa|PPS|Palawan|beaches,nature,water
Taipei|Taiwan|Taipei|TPE|Taipei|food,design,nightlife
Kaohsiung|Taiwan|Kaohsiung|KHH|Kaohsiung|food,design,coast
Hong Kong|China|Hong Kong|HKG|Hong Kong|food,design,nightlife
Macau|China|Macau|MFM|Macau|food,history,nightlife
Chengdu|China|Sichuan|CTU|Chengdu|food,culture,nature
Xi'an|China|Shaanxi|XIY|Xi'an|history,food,culture
Guilin|China|Guangxi|KWL|Guilin|nature,photography,adventure
Hangzhou|China|Zhejiang|HGH|Hangzhou|lakes,food,culture
Suzhou|China|Jiangsu|PVG|Suzhou|gardens,history,food
Guangzhou|China|Guangdong|CAN|Guangzhou|food,design,culture
Shenzhen|China|Guangdong|SZX|Shenzhen|design,food,nightlife
Osaka|Japan|Kansai|KIX|Osaka|food,nightlife,culture
Hiroshima|Japan|Chūgoku|HIJ|Hiroshima|history,food,culture
Sapporo|Japan|Hokkaido|CTS|Sapporo|food,winter,nature
Fukuoka|Japan|Kyushu|FUK|Fukuoka|food,nightlife,culture
Nikko|Japan|Tochigi|NRT|Nikkō|nature,history,hiking
Hakone|Japan|Kanagawa|HND|Hakone|wellness,nature,mountains
Okinawa Island|Japan|Okinawa|OKA|Okinawa Island|beaches,food,culture
Kobe|Japan|Kansai|UKB|Kobe|food,design,coast
Nagasaki|Japan|Kyushu|NGS|Nagasaki|history,food,coast
Seoul|South Korea|Seoul Capital Area|ICN|Seoul|food,design,nightlife
Gyeongju|South Korea|North Gyeongsang|PUS|Gyeongju|history,culture,food
Daegu|South Korea|Yeongnam|TAE|Daegu|food,culture,nightlife
Perth|Australia|Western Australia|PER|Perth|beaches,food,nature
Brisbane|Australia|Queensland|BNE|Brisbane|food,coast,nature
Adelaide|Australia|South Australia|ADL|Adelaide|food,wine,coast
Hobart|Australia|Tasmania|HBA|Hobart|food,nature,design
Cairns|Australia|Queensland|CNS|Cairns|nature,water,adventure
Gold Coast|Australia|Queensland|OOL|Gold Coast, Queensland|beaches,nightlife,family
Darwin|Australia|Northern Territory|DRW|Darwin, Northern Territory|nature,food,adventure
Auckland|New Zealand|Auckland Region|AKL|Auckland|food,coast,nature
Wellington|New Zealand|Wellington Region|WLG|Wellington|food,design,culture
Rotorua|New Zealand|Bay of Plenty|ROT|Rotorua|nature,culture,wellness
Fiji|Fiji|Melanesia|NAN|Fiji|beaches,water,relaxation
Rarotonga|Cook Islands|Cook Islands|RAR|Rarotonga|beaches,nature,relaxation
Nouméa|New Caledonia|New Caledonia|NOU|Nouméa|beaches,food,culture
Apia|Samoa|Tuamasaga|APW|Apia|beaches,culture,nature
Port Vila|Vanuatu|Shefa|VLI|Port Vila|beaches,nature,adventure
`.trim().split("\n").map((line) => {
  const [name, country, region, nearestAirport, wikiTitle, interests] = line.split("|");
  return { name, country, region, nearestAirport, wikiTitle, interestTags: interests.split(",") };
});

const key = (name, country) => `${name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}|${country.toLowerCase()}`;
const existing = new Set(destinations.map((item) => key(item.city, item.country)));
const seen = new Set();
const costLevels = ["affordable", "moderate", "upscale", "luxury"];
const knownnessBands = [[10, 20], [25, 40], [45, 60], [65, 80], [85, 98]];
const candidates = rows.filter((item) => {
  const value = key(item.name, item.country);
  if (existing.has(value) || seen.has(value)) return false;
  seen.add(value);
  return true;
}).map((item, index) => {
  const band = knownnessBands[index % knownnessBands.length];
  return { ...item, knownnessScore: band[0] + (index % (band[1] - band[0] + 1)), costLevel: costLevels[(index * 3 + Math.floor(index / 5)) % costLevels.length], travelerTypeTags: index % 3 === 0 ? ["couple", "friends"] : index % 3 === 1 ? ["solo", "couple"] : ["family", "friends"], aliases: [item.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")], searchTerms: [item.name, item.region, item.country] };
});

await writeFile("scripts/destinations/seed-batch-03.json", `${JSON.stringify(candidates, null, 2)}\n`);
console.log(JSON.stringify({ existing: destinations.length, candidates: candidates.length, neededFor300: 300 - destinations.length }, null, 2));
