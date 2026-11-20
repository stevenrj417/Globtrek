// Batch 06: 150 places that fill GlobTrek's thin regions (Asia, Oceania, Africa,
// Latin America, the US). Chosen by hand on 2026-11-20.
//   node scripts/destinations/build-seed-batch-06.mjs
//   node scripts/destinations/verify-wikimedia.mjs scripts/destinations/seed-batch-06.json scripts/destinations/verified-batch-06.json --delay 400
//
// Columns: name | country | region | airport | Wikipedia title | interest tags |
//          knownness 0–100 | cost level | destination type | who (A = everyone, D = adults)
// The airport is the one most travelers fly into, checked against app/data/airports.json.
import { readFileSync, writeFileSync } from "node:fs";
import { destinations } from "../../app/data/destinations.js";

const root = new URL("../../", import.meta.url);
const rows = `
Santa Barbara|United States|California|SBA|Santa Barbara, California|coast,food,wine|60|upscale|City|A
Monterey|United States|California|MRY|Monterey, California|coast,wildlife,food|55|upscale|Coastal town|A
Napa Valley|United States|California|SFO|Napa Valley AVA|wine,food,relaxation,culture|75|luxury|Wine region|D
Lake Tahoe|United States|California|RNO|Lake Tahoe|lakes,mountains,winter,hiking|75|upscale|Lake region|A
Moab|United States|Utah|GJT|Moab, Utah|desert,adventure,hiking|55|moderate|Small town|A
Grand Canyon|United States|Arizona|FLG|Grand Canyon National Park|nature,hiking,photography|95|moderate|National park|A
Yosemite|United States|California|FAT|Yosemite National Park|nature,hiking,mountains|90|moderate|National park|A
Joshua Tree|United States|California|PSP|Joshua Tree National Park|desert,stargazing,hiking|65|moderate|National park|D
Key West|United States|Florida|EYW|Key West, Florida|beaches,nightlife,water|75|upscale|Island town|D
St. Augustine|United States|Florida|JAX|St. Augustine, Florida|history,beaches,architecture|50|moderate|Historic town|A
Minneapolis|United States|Minnesota|MSP|Minneapolis|city,lakes,food,music|50|moderate|City|A
Denver|United States|Colorado|DEN|Denver|city,mountains,food|65|moderate|City|A
Salt Lake City|United States|Utah|SLC|Salt Lake City|mountains,winter,hiking|50|moderate|City|A
Jackson Hole|United States|Wyoming|JAC|Jackson Hole, Wyoming|mountains,wildlife,winter|60|luxury|Mountain town|A
Kauai|United States|Hawaii|LIH|Kauai|beaches,hiking,nature|70|upscale|Island|A
Hawaii Island|United States|Hawaii|KOA|Hawaii (island)|beaches,nature,adventure|70|upscale|Island|A
Outer Banks|United States|North Carolina|ORF|Outer Banks|beaches,history,family|45|moderate|Coastal region|A
Cape Cod|United States|Massachusetts|BOS|Cape Cod|beaches,food,family|65|upscale|Coastal region|A
Portland Maine|United States|Maine|PWM|Portland, Maine|food,coast,history|45|moderate|Small city|A
Burlington|United States|Vermont|BTV|Burlington, Vermont|lakes,food,nature|30|moderate|Small city|A
Whistler|Canada|British Columbia|YVR|Whistler, British Columbia|mountains,winter,hiking,adventure|75|upscale|Mountain town|A
Niagara Falls|Canada|Ontario|YYZ|Niagara Falls|nature,water,family|90|moderate|Natural landmark|A
Prince Edward Island|Canada|Prince Edward Island|YYG|Prince Edward Island|beaches,food,family|40|moderate|Island|A
Kelowna|Canada|British Columbia|YLW|Kelowna|wine,lakes,food|30|moderate|Small city|D
Puebla|Mexico|Puebla|MEX|Puebla (city)|food,architecture,history|45|affordable|City|A
Sayulita|Mexico|Nayarit|PVR|Sayulita|beaches,food,adventure|45|moderate|Coastal town|D
Puerto Escondido|Mexico|Oaxaca|PXM|Puerto Escondido, Oaxaca|beaches,adventure,nightlife|45|affordable|Coastal town|D
San Cristóbal de las Casas|Mexico|Chiapas|TGZ|San Cristóbal de las Casas|culture,history,mountains|40|affordable|Historic town|D
Cozumel|Mexico|Quintana Roo|CZM|Cozumel|diving,beaches,water|65|moderate|Island|A
Granada|Nicaragua|Granada|MGA|Granada, Nicaragua|history,architecture,lakes|35|affordable|Historic city|D
El Tunco|El Salvador|La Libertad|SAL|Tamanique|beaches,adventure,nightlife|20|affordable|Coastal town|D
Boquete|Panama|Chiriquí|DAV|Boquete|mountains,hiking,food|25|affordable|Mountain town|D
St. Lucia|Saint Lucia|Saint Lucia|UVF|Saint Lucia|beaches,hiking,relaxation|65|luxury|Island nation|D
Grenada|Grenada|Grenada|GND|Grenada|beaches,diving,food|35|upscale|Island nation|A
Antigua|Antigua and Barbuda|Antigua|ANU|Antigua|beaches,water,relaxation|55|luxury|Island|A
Turks and Caicos|Turks and Caicos Islands|Providenciales|PLS|Providenciales|beaches,diving,relaxation|65|luxury|Island|A
Grand Cayman|Cayman Islands|Grand Cayman|GCM|Grand Cayman|beaches,diving,water|60|luxury|Island|A
Martinique|Martinique|Martinique|FDF|Martinique|beaches,food,hiking|40|upscale|Island|A
Villa de Leyva|Colombia|Boyacá|BOG|Villa de Leyva|history,architecture,nature|25|affordable|Historic town|A
Guatapé|Colombia|Antioquia|MDE|Guatapé|lakes,nature,adventure|40|affordable|Lake town|A
Baños|Ecuador|Tungurahua|UIO|Baños de Agua Santa|adventure,wellness,mountains|35|affordable|Mountain town|D
Sacred Valley|Peru|Cusco|CUZ|Sacred Valley|history,hiking,mountains,culture|65|moderate|Scenic region|A
Paracas|Peru|Ica|LIM|Paracas|wildlife,desert,coast|30|affordable|Coastal town|A
Puno and Lake Titicaca|Peru|Puno|JUL|Lake Titicaca|lakes,culture,mountains|60|affordable|Lake region|A
Sucre|Bolivia|Chuquisaca|SRE|Sucre|history,architecture,culture|30|affordable|Historic city|D
Pucón|Chile|Araucanía|ZPC|Pucón|adventure,lakes,mountains,wellness|35|moderate|Mountain town|A
Easter Island|Chile|Valparaíso|IPC|Easter Island|history,culture,nature|75|upscale|Island|A
Ushuaia|Argentina|Tierra del Fuego|USH|Ushuaia|nature,hiking,adventure|60|moderate|Small city|A
Paraty|Brazil|Rio de Janeiro|GIG|Paraty|history,beaches,architecture|40|moderate|Historic town|A
Jericoacoara|Brazil|Ceará|JJD|Jericoacoara|beaches,adventure,relaxation|40|moderate|Coastal town|D
Fernando de Noronha|Brazil|Pernambuco|FEN|Fernando de Noronha|diving,beaches,wildlife|45|luxury|Island|D
Ouro Preto|Brazil|Minas Gerais|CNF|Ouro Preto|history,architecture,culture|30|affordable|Historic town|A
Sal|Cape Verde|Sal|SID|Sal, Cape Verde|beaches,water,relaxation|30|moderate|Island|A
Mindelo|Cape Verde|São Vicente|VXE|Mindelo|music,culture,beaches|15|affordable|Small city|D
Cape Coast|Ghana|Central Region|ACC|Cape Coast|history,beaches,culture|30|affordable|Historic town|A
Banjul and the Gambian coast|Gambia|Banjul|BJL|Kololi|beaches,wildlife,relaxation|20|affordable|Coastal region|A
Diani Beach|Kenya|Kwale|MBA|Diani Beach|beaches,diving,relaxation|45|moderate|Coastal town|A
Arusha|Tanzania|Arusha|JRO|Arusha|wildlife,adventure,culture|50|moderate|City|A
Ngorongoro|Tanzania|Arusha|JRO|Ngorongoro Conservation Area|wildlife,nature,photography|70|luxury|National park|A
Jinja|Uganda|Busoga|EBB|Jinja, Uganda|adventure,water,nature|25|affordable|Small city|D
Lalibela|Ethiopia|Amhara|ADD|Lalibela|history,culture,architecture|45|affordable|Historic town|D
Tofo|Mozambique|Inhambane|INH|Tofo Beach|diving,beaches,wildlife|20|affordable|Coastal town|D
Lake Malawi|Malawi|Southern Region|LLW|Lake Malawi National Park|lakes,diving,relaxation|30|affordable|Lake region|D
Livingstone|Zambia|Southern Province|LVI|Livingstone, Zambia|adventure,nature,wildlife|50|moderate|Small city|A
Stellenbosch|South Africa|Western Cape|CPT|Stellenbosch|wine,food,mountains|55|moderate|Wine region|D
Drakensberg|South Africa|KwaZulu-Natal|DUR|Drakensberg|hiking,mountains,nature|45|moderate|Mountain region|A
Swakopmund|Namibia|Erongo|WVB|Swakopmund|desert,adventure,coast|35|moderate|Coastal town|A
Etosha|Namibia|Oshana|WDH|Etosha National Park|wildlife,nature,photography|55|upscale|National park|A
Djerba|Tunisia|Medenine|DJE|Djerba|beaches,culture,relaxation|40|affordable|Island|A
Dahab|Egypt|South Sinai|SSH|Dahab|diving,desert,relaxation|45|affordable|Coastal town|D
Hurghada|Egypt|Red Sea|HRG|Hurghada|diving,beaches,family|60|affordable|Coastal town|A
Alexandria|Egypt|Alexandria|HBE|Alexandria|history,coast,food|70|affordable|City|A
Réunion|Réunion|Réunion|RUN|Réunion|hiking,mountains,nature,adventure|35|upscale|Island|A
Rabat|Morocco|Rabat-Salé-Kénitra|RBA|Rabat|history,architecture,coast|45|affordable|City|A
Aqaba|Jordan|Aqaba|AQJ|Aqaba|diving,beaches,desert|45|moderate|Coastal town|A
Dead Sea|Jordan|Balqa|AMM|Dead Sea|wellness,relaxation,nature|80|upscale|Natural landmark|A
Byblos|Lebanon|Keserwan-Jbeil|BEY|Byblos|history,coast,food|45|moderate|Historic town|A
Salalah|Oman|Dhofar|SLL|Salalah|beaches,nature,culture|30|moderate|City|A
Nizwa|Oman|Ad Dakhiliyah|MCT|Nizwa|history,culture,mountains|30|moderate|Historic town|A
Ras Al Khaimah|United Arab Emirates|Ras Al Khaimah|DXB|Ras Al Khaimah|beaches,mountains,adventure|35|upscale|Coastal region|A
Hiroshima|Japan|Hiroshima|HIJ|Hiroshima|history,food,culture|80|moderate|City|A
Fukuoka|Japan|Fukuoka|FUK|Fukuoka|food,city,nightlife|55|moderate|City|A
Hakone|Japan|Kanagawa|HND|Hakone, Kanagawa|wellness,mountains,art|60|upscale|Mountain town|A
Nikko|Japan|Tochigi|HND|Nikkō, Tochigi|history,nature,culture|55|moderate|Historic town|A
Okinawa|Japan|Okinawa|OKA|Okinawa Island|beaches,diving,culture|60|moderate|Island|A
Ishigaki|Japan|Okinawa|ISG|Ishigaki Island|beaches,diving,nature|35|moderate|Island|A
Gyeongju|South Korea|North Gyeongsang|PUS|Gyeongju|history,culture,food|40|affordable|Historic city|A
Chengdu|China|Sichuan|TFU|Chengdu|food,wildlife,culture|65|affordable|City|A
Xi'an|China|Shaanxi|XIY|Xi'an|history,food,culture|75|affordable|City|A
Zhangjiajie|China|Hunan|DYG|Zhangjiajie National Forest Park|nature,hiking,photography|55|affordable|National park|A
Lijiang|China|Yunnan|LJG|Old Town of Lijiang|history,mountains,culture|45|affordable|Historic town|A
Tainan|Taiwan|Tainan|KHH|Tainan|food,history,culture|35|affordable|City|A
Taroko Gorge|Taiwan|Hualien|HUN|Taroko National Park|nature,hiking,mountains|40|affordable|National park|A
Ulaanbaatar|Mongolia|Ulaanbaatar|UBN|Ulaanbaatar|culture,adventure,nature|35|affordable|City|D
Krabi|Thailand|Krabi|KBV|Krabi province|beaches,adventure,diving|70|affordable|Coastal region|A
Koh Samui|Thailand|Surat Thani|USM|Ko Samui|beaches,relaxation,wellness|75|moderate|Island|A
Koh Tao|Thailand|Surat Thani|USM|Ko Tao|diving,beaches,nightlife|50|affordable|Island|D
Pai|Thailand|Mae Hong Son|CNX|Pai, Thailand|mountains,relaxation,nature|40|affordable|Small town|D
Chiang Rai|Thailand|Chiang Rai|CEI|Chiang Rai|culture,art,mountains|45|affordable|Small city|A
Ho Chi Minh City|Vietnam|Ho Chi Minh City|SGN|Ho Chi Minh City|food,city,nightlife,history|75|affordable|City|A
Hue|Vietnam|Thừa Thiên Huế|HUI|Huế|history,food,culture|50|affordable|Historic city|A
Phu Quoc|Vietnam|Kiên Giang|PQC|Phú Quốc|beaches,relaxation,diving|55|moderate|Island|A
Da Lat|Vietnam|Lâm Đồng|DLI|Da Lat|mountains,food,nature|40|affordable|Mountain town|A
Ninh Binh|Vietnam|Ninh Bình|HAN|Tràng An|nature,history,photography|50|affordable|Scenic region|A
Phnom Penh|Cambodia|Phnom Penh|KTI|Phnom Penh|history,food,culture|55|affordable|City|D
Kampot|Cambodia|Kampot|KTI|Kampot (city)|nature,food,relaxation,ocean|20|affordable|Small town|D
Vang Vieng|Laos|Vientiane Province|VTE|Vang Vieng|adventure,nature,water,mountains|40|affordable|Small town|D
Lombok|Indonesia|West Nusa Tenggara|LOP|Lombok|beaches,hiking,adventure|55|affordable|Island|A
Gili Islands|Indonesia|West Nusa Tenggara|LOP|Gili Islands|diving,beaches,nightlife|55|affordable|Island|D
Raja Ampat|Indonesia|Southwest Papua|SOQ|Raja Ampat Islands|diving,wildlife,nature|50|upscale|Island region|D
Langkawi|Malaysia|Kedah|LGK|Langkawi|beaches,nature,relaxation|55|moderate|Island|A
Malacca|Malaysia|Malacca|KUL|Malacca City|history,food,architecture|50|affordable|Historic city|A
Siargao|Philippines|Surigao del Norte|IAO|Siargao|beaches,adventure,water,nature|45|affordable|Island|D
Bohol|Philippines|Bohol|TAG|Bohol|nature,beaches,diving,wildlife|50|affordable|Island|A
Goa|India|Goa|GOI|Goa|beaches,food,nightlife|75|affordable|Coastal region|A
Rishikesh|India|Uttarakhand|DED|Rishikesh|wellness,adventure,mountains|60|affordable|Small city|D
Agra|India|Uttar Pradesh|AGR|Agra|history,architecture,culture|90|affordable|City|A
Leh|India|Ladakh|IXL|Leh|mountains,adventure,culture|45|affordable|Mountain town|D
Amritsar|India|Punjab|ATQ|Amritsar|culture,history,food|55|affordable|City|A
Darjeeling|India|West Bengal|IXB|Darjeeling|mountains,hiking,food|55|affordable|Mountain town|A
Ella|Sri Lanka|Uva|CMB|Ella, Sri Lanka|hiking,mountains,nature|45|affordable|Small town|A
Galle|Sri Lanka|Southern Province|CMB|Galle|history,beaches,architecture|55|moderate|Historic town|A
Bukhara|Uzbekistan|Bukhara|BHK|Bukhara|history,architecture,culture|45|affordable|Historic city|A
Khiva|Uzbekistan|Khorezm|UGC|Khiva|history,architecture,culture|35|affordable|Historic town|A
Tashkent|Uzbekistan|Tashkent|TAS|Tashkent|food,city,culture|35|affordable|City|A
Batumi|Georgia|Adjara|BUS|Batumi|beaches,nightlife,food|35|affordable|City|A
Baku|Azerbaijan|Absheron|GYD|Baku|architecture,food,history|45|moderate|City|A
Brisbane|Australia|Queensland|BNE|Brisbane|food,city,coast|65|moderate|City|A
Adelaide|Australia|South Australia|ADL|Adelaide|food,wine,coast|50|moderate|City|A
Gold Coast|Australia|Queensland|OOL|Gold Coast, Queensland|beaches,nightlife,family|65|moderate|Coastal region|A
Byron Bay|Australia|New South Wales|BNK|Byron Bay, New South Wales|beaches,wellness,food|60|upscale|Coastal town|A
Margaret River|Australia|Western Australia|PER|Margaret River, Western Australia|wine,beaches,food|40|upscale|Wine region|D
Kangaroo Island|Australia|South Australia|KGC|Kangaroo Island|wildlife,nature,food|35|upscale|Island|A
Blue Mountains|Australia|New South Wales|SYD|Blue Mountains (New South Wales)|hiking,nature,mountains|60|moderate|Mountain region|A
Whitsunday Islands|Australia|Queensland|PPP|Whitsunday Islands|beaches,water,diving|60|upscale|Island region|A
Rotorua|New Zealand|Bay of Plenty|ROT|Rotorua|culture,nature,wellness|55|moderate|Small city|A
Bay of Islands|New Zealand|Northland|KKE|Bay of Islands|water,beaches,history|40|moderate|Coastal region|A
Wanaka|New Zealand|Otago|ZQN|Wānaka|lakes,mountains,hiking|40|upscale|Lake town|A
Abel Tasman|New Zealand|Tasman|NSN|Abel Tasman National Park|hiking,beaches,nature|40|moderate|National park|A
Nouméa|New Caledonia|South Province|NOU|Nouméa|beaches,food,diving|25|upscale|City|A
Port Vila|Vanuatu|Shefa|VLI|Port Vila|beaches,diving,culture|25|moderate|City|A
Tirana|Albania|Tirana|TIA|Tirana|food,city,nightlife|35|affordable|City|D
Sarandë|Albania|Vlorë|TIA|Sarandë|beaches,history,food|35|affordable|Coastal town|A
Veliko Tarnovo|Bulgaria|Veliko Tarnovo|SOF|Veliko Tarnovo|history,architecture,culture|25|affordable|Historic town|A
Cluj-Napoca|Romania|Cluj|CLJ|Cluj-Napoca|food,nightlife,culture|30|affordable|City|D
Sighișoara|Romania|Mureș|TGM|Sighișoara|history,architecture,culture|35|affordable|Historic town|A
Novi Sad|Serbia|Vojvodina|BEG|Novi Sad|music,food,history|30|affordable|City|D
Prizren|Kosovo|Prizren|PRN|Prizren|history,culture,mountains|15|affordable|Historic town|A
Skopje|North Macedonia|Skopje|SKP|Skopje|history,food,culture|25|affordable|City|A
Brno|Czech Republic|South Moravia|BRQ|Brno|food,architecture,nightlife|25|affordable|City|D
`.trim().split("\n").map((line) => {
  const [name, country, region, airport, wiki, tags, known, cost, type, who] = line.split("|");
  return { name, country, region, airport, wiki, tags: tags.split(","), known: Number(known), cost, type, who: who === "A" ? ["couple", "friends", "solo", "family"] : ["couple", "friends", "solo"] };
});

// Articles with no usable lead photo or no coordinates: a hero photo chosen by
// hand on Commons and the coordinates of the town travelers stay in.
const HERO = {
  "Puerto Escondido": { heroFile: "Playa Carrizalillo Puerto Escondido.jpg", coordinates: [15.8617, -97.0726] },
  "El Tunco": { heroFile: "El tunco.png", coordinates: [13.4936, -89.3833] },
  Boquete: { heroFile: "Aerial view of Boquete, Panama.jpg", coordinates: [8.7799, -82.441] },
  Paracas: { heroFile: "Paracas National Reserve. Ica, Peru.jpg", coordinates: [-13.834, -76.251] },
  Sal: { heroFile: "Fishing boats Santa Maria, Sal, Cape Verde (4334753258).jpg", coordinates: [16.599, -22.905] },
  "Dead Sea": { heroFile: "Dead Sea salt crystals.jpg", coordinates: [31.719, 35.589] },
  Tashkent: { heroFile: "Novza Jome masjidi.jpg", coordinates: [41.2995, 69.2401] },
  "Whitsunday Islands": { heroFile: "Whitehaven Beach - Northern End.jpg", coordinates: [-20.2683, 148.7181] },
};

// Lead photos that were a map, flag, satellite view, collage, street corner or
// too small, replaced by hand after looking at every one on 2026-11-20.
const PHOTO = {
  "Mindelo": "Mindelo (S Vicente, Cabo Verde).JPG",
  "Koh Samui": "Koh Samui, Island, Beach, Thailand.jpg",
  "Ninh Binh": "Trang An Landscape Complex, Ninh Binh Province, Vietnam, 20240202 1447 5310.jpg",
  "Vang Vieng": "Red metal bridge over the Nam Song River front view in Vang Vieng Laos.jpg",
  "Raja Ampat": "Wayag Island.jpg",
  "Santa Barbara": "Mission Santa Barbara.jpg",
  "Napa Valley": "Vineyards in Napa Valley 7.jpg",
  "Kauai": "Na Pali Coast.jpg",
  "Hawaii Island": "Sulfur dioxide emissions from the Halemaumau vent 04-08-1 1.jpg",
  "Outer Banks": "Bodie Island Lighthouse 2008.JPG",
  "Whistler": "Summer skiing on Blackcomb Mountain (534592174).jpg",
  "Prince Edward Island": "Cavendish Coast, Prince Edward Island (471112) (9447889529).jpg",
  "Sayulita": "Beach in Sayulita, Mexico.jpg",
  "San Cristóbal de las Casas": "San Cristóbal de las Casas, cathedral (14362887351).jpg",
  "Cozumel": "Beach Chairs In Cozumel Mexico (125160641).jpeg",
  "St. Lucia": "Soufriere town and the Pitons, Saint Lucia (wide view).jpg",
  "Grenada": "Grand Anse Beach Grenada.jpg",
  "Antigua": "Antigua Shirley's Heights English Harbour.jpg",
  "Grand Cayman": "Seven Mile Beach Facing North.jpg",
  "Martinique": "Plage du Carbet, Martinique (janvier 1982).jpg",
  "Guatapé": "Vista desde la Piedra del Penol - Colombia 02.jpg",
  "Puno and Lake Titicaca": "Islas flotantes de los Uros, Lago Titicaca, Perú, 2015-08-01, DD 25.JPG",
  "Pucón": "Pucón, Villarrica 01.jpg",
  "Jericoacoara": "Dunas jericoacoara 01.jpg",
  "Cape Coast": "Cape Coast Castle, Cape Coast, Ghana.JPG",
  "Jinja": "Source of the Nile, Jinja Uganda - international tourist site.jpg",
  "Livingstone": "Cataratas Victoria, Zambia-Zimbabue, 2018-07-27, DD 30-34 PAN.jpg",
  "Stellenbosch": "Vineyards in Stellenbosch II.jpg",
  "Djerba": "Djerba beach-katinalynn.jpg",
  "Hurghada": "Sheraton Rd, Qesm Hurghada, Red Sea Governorate, Egypt - panoramio.jpg",
  "Réunion": "Piton de La Fournaise - Paysage de l'île de La Réunion.jpg",
  "Aqaba": "Red sea stony beach taba egypt.jpg",
  "Ras Al Khaimah": "Jebel Jais 01.jpg",
  "Okinawa": "Furuzamami beach Okinawa Zamami.jpg",
  "Ishigaki": "Kabira Bay Ishigaki Island40bs3s4592.jpg",
  "Lake Malawi": "Haliaeetus vocifer -Cape Maclear, Malawi -fishing-8.jpg",
  "Banjul and the Gambian coast": "GambiaKololiBeach106 (11905120026).jpg",
  "Gyeongju": "Bulguksa temple entrance gate stairs flower bed and blue sky in Gyeongju South Korea.jpg",
  "Tainan": "Chihkan Tower night.JPG",
  "Koh Tao": "Koh Nang Yuan.jpg",
  "Pai": "Pai canyon 3.jpg",
  "Hue": "Gate in Imperial City, Huế (III).jpg",
  "Gili Islands": "People on the beach, Gili Trawangan (island), Indonesia.jpg",
  "Siargao": "Cloud 8, Siargao Island.jpg",
  "Ella": "Nine arch bridge 1.jpg",
  "Da Lat": "Da Lat - Xuan Huong Lake.jpg",
  "Margaret River": "Gralyn Winery, Margaret River, Australia.jpg",
  "Rotorua": "ChampagnePool-Wai-O-Tapu rotated MC.jpg",
  "Port Vila": "Port Vila Harbour, Vanuatu (380280436).jpg",
  "Veliko Tarnovo": "Tsarevets - Veliko Tarnovo - 2.jpg",
  "Brno": "Brno, katedrála sv. Petra a Pavla.jpg",
  "Blue Mountains": "Three Sisters, Blue Mountains (1).jpg",
};

const fold = (value) => String(value).normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const existing = new Set(destinations.map((item) => `${fold(item.city)}|${fold(item.country)}`));
const airports = new Map(JSON.parse(readFileSync(new URL("app/data/airports.json", root), "utf8")).map((airport) => [airport.code, airport]));

const problems = [];
const seen = new Set();
for (const row of rows) {
  const key = `${fold(row.name)}|${fold(row.country)}`;
  if (existing.has(key)) problems.push(`${row.name}: already in the catalog`);
  if (seen.has(key)) problems.push(`${row.name}: listed twice`);
  seen.add(key);
  if (!airports.get(row.airport)?.scheduled) problems.push(`${row.name}: ${row.airport} is not a scheduled airport`);
  if (!["affordable", "moderate", "upscale", "luxury"].includes(row.cost)) problems.push(`${row.name}: cost level ${row.cost}`);
}
if (rows.length !== 150) problems.push(`${rows.length} rows, expected 150`);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }

const seeds = rows.map((row) => ({
  name: row.name,
  country: row.country,
  region: row.region,
  destinationType: row.type,
  nearestAirport: row.airport,
  wikiTitle: row.wiki,
  interestTags: row.tags,
  knownnessScore: row.known,
  costLevel: row.cost,
  travelerTypeTags: row.who,
  aliases: [row.name, row.name.normalize("NFKD").replace(/[̀-ͯ]/g, ""), row.wiki].filter((value, index, list) => list.indexOf(value) === index),
  searchTerms: [row.name, row.region, row.country].filter(Boolean),
  ...(HERO[row.name] || {}),
  ...(PHOTO[row.name] ? { heroFile: PHOTO[row.name] } : {}),
}));
writeFileSync(new URL("scripts/destinations/seed-batch-06.json", root), `${JSON.stringify(seeds, null, 2)}\n`);
console.log(`${seeds.length} seeds written`);
