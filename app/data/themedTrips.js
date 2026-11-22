// GlobTrek's themed trips and expeditions.
//
// Each trip is a list of stops on GlobTrek's destination list (`id`, with its
// nights), priced live by the same budget engine as every other trip: flights
// from the traveler's airport, a room, food, things to do and getting around.
// Where a place isn't on the list yet, `pricedFrom` names the nearby destination
// whose prices stand in, and the page says so.
//
// `extras` are fixed costs with a published price (entry tickets, passes), in
// the local currency, checked on `checked` against the sources listed. A
// `package` stop is a guided trip sold as one price (an Antarctic expedition
// ship, a desert tour): its range comes from operators' published fares.
// Nothing here is a quote; every page says what each line is based on.

const CHECKED = "2026-11-22";

// Photos for trips whose destination photo doesn't show the theme. Wikimedia
// Commons files, used under the licenses listed (credited on the page and on
// /photo-credits).
export const THEMED_PHOTOS = Object.freeze({
  antarctica: { url: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Iceberg_in_Antarctica%2C_Antarctic_Peninsula.JPEG", subject: "An iceberg off the Antarctic Peninsula", artist: "PaoMic", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", source: "https://commons.wikimedia.org/wiki/File:Iceberg_in_Antarctica,_Antarctic_Peninsula.JPEG" },
  chinguetti: { url: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Chinguetti_dunes.jpg", subject: "Dunes at Chinguetti, Mauritania", artist: "Radosław Botev", license: "CC BY 3.0 PL", licenseUrl: "https://creativecommons.org/licenses/by/3.0/pl/", source: "https://commons.wikimedia.org/wiki/File:Chinguetti_dunes.jpg" },
  petra: { url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Al-Khazneh_%28The_Treasury%29_2%2C_Petra%2C_Jordan.jpg", subject: "Al-Khazneh (the Treasury), Petra", artist: "Vyacheslav Argenberg", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", source: "https://commons.wikimedia.org/wiki/File:Al-Khazneh_(The_Treasury)_2,_Petra,_Jordan.jpg" },
  chichen: { url: "https://upload.wikimedia.org/wikipedia/commons/0/02/Templo_el_Castillo_-_Chichen_Itza-Yucatan-Mexico0222.jpg", subject: "El Castillo, Chichén Itzá", artist: "Diego Delso", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", source: "https://commons.wikimedia.org/wiki/File:Templo_el_Castillo_-_Chichen_Itza-Yucatan-Mexico0222.jpg" },
  greatWall: { url: "https://upload.wikimedia.org/wikipedia/commons/6/64/The_Mutianyu_section_of_the_Great_Wall_of_China.jpg", subject: "The Mutianyu section of the Great Wall of China", artist: "Lloyd Tudor", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", source: "https://commons.wikimedia.org/wiki/File:The_Mutianyu_section_of_the_Great_Wall_of_China.jpg" },
  redeemer: { url: "https://upload.wikimedia.org/wikipedia/commons/3/30/Rio_skyline_and_Cristo_Redentor_from_Sugarloaf_Mountain%2C_Brazil.jpg", subject: "Rio de Janeiro and Christ the Redeemer from Sugarloaf Mountain", artist: "Wilfredor", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:Rio_skyline_and_Cristo_Redentor_from_Sugarloaf_Mountain,_Brazil.jpg" },
  colosseum: { url: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Colosseum_of_Rome_and_Roman_forum.jpg", subject: "The Colosseum and the Roman Forum", artist: "Wilfredor", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:Colosseum_of_Rome_and_Roman_forum.jpg" },
  ubud: { url: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Rice_terraces%2C_Ubud%2C_Bali.jpg", subject: "Rice terraces near Ubud, Bali", artist: "Vyacheslav Argenberg", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", source: "https://commons.wikimedia.org/wiki/File:Rice_terraces,_Ubud,_Bali.jpg" },
  sidemen: { url: "https://upload.wikimedia.org/wikipedia/commons/c/c2/RICE_TERRACE_OF_SIDEMEN_EAST_BALI.jpg", subject: "Rice terraces in Sidemen, east Bali", artist: "Adimelali Bali", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", source: "https://commons.wikimedia.org/wiki/File:RICE_TERRACE_OF_SIDEMEN_EAST_BALI.jpg" },
  munduk: { url: "https://upload.wikimedia.org/wikipedia/commons/6/67/Munduk_air_terjun_2009.jpg", subject: "A waterfall near Munduk, Bali", artist: "Jean-Marie Hullot", license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/", source: "https://commons.wikimedia.org/wiki/File:Munduk_air_terjun_2009.jpg" },
  lembongan: { url: "https://upload.wikimedia.org/wikipedia/commons/8/82/Dream_Beach%2C_Nusa_Lembogan%2C_Bali%2C_Indonesia.jpg", subject: "Dream Beach, Nusa Lembongan", artist: "Aurelia Teslaru", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", source: "https://commons.wikimedia.org/wiki/File:Dream_Beach,_Nusa_Lembogan,_Bali,_Indonesia.jpg" },
  kohLipe: { url: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Koh_Lipe_%28island%29%2C_Beach%2C_Thailand.jpg", subject: "A beach on Koh Lipe, Thailand", artist: "Vyacheslav Argenberg", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", source: "https://commons.wikimedia.org/wiki/File:Koh_Lipe_(island),_Beach,_Thailand.jpg" },
  saimaa: { url: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Lake_Saimaa_aerial.jpg", subject: "Lake Saimaa from the air, Finnish Lakeland", artist: "kallerna", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", source: "https://commons.wikimedia.org/wiki/File:Lake_Saimaa_aerial.jpg" },
  ibiza: { url: "https://upload.wikimedia.org/wikipedia/commons/4/49/D%E2%80%99Alt_Vila_-_Ibiza_-_50956011832.jpg", subject: "Dalt Vila, Ibiza", artist: "erwin@jetcamp.com", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", source: "https://commons.wikimedia.org/wiki/File:D’Alt_Vila_-_Ibiza_-_50956011832.jpg" },
  dingle: { url: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Dingle_Bay.jpg", subject: "Dingle Bay, Ireland", artist: "Matt Gillman", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", source: "https://commons.wikimedia.org/wiki/File:Dingle_Bay.jpg" },
  algarve: { url: "https://upload.wikimedia.org/wikipedia/commons/8/88/Ponta_da_Piedade%2C_Lagos_%2820083809934%29.jpg", subject: "Ponta da Piedade, Lagos, Algarve", artist: "Paul Wilkinson", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", source: "https://commons.wikimedia.org/wiki/File:Ponta_da_Piedade,_Lagos_(20083809934).jpg" },
  tuscany: { url: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Italy_-_Tuscany_-_Val_d%27Orcia.jpg", subject: "The Val d'Orcia, Tuscany", artist: "Didier Baertschiger", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/", source: "https://commons.wikimedia.org/wiki/File:Italy_-_Tuscany_-_Val_d'Orcia.jpg" },
  disneyland: { url: "https://upload.wikimedia.org/wikipedia/commons/7/70/Sleeping_Beauty_Castle_Disneyland_Anaheim_2013.jpg", subject: "Sleeping Beauty Castle, Disneyland, Anaheim", artist: "Tuxyso", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", source: "https://commons.wikimedia.org/wiki/File:Sleeping_Beauty_Castle_Disneyland_Anaheim_2013.jpg" },
});

// Fixed costs with a published price, per person, in local currency.
export const EXTRAS = Object.freeze({
  machuPicchu: { label: "Machu Picchu entry ticket (standard circuit)", amount: 152, currency: "PEN", source: "https://andina.pe/ingles/noticia-planning-to-visit-machu-picchu-in-2026-check-out-new-ticket-rates-and-visitor-limits-1050546.aspx", note: "Book on tuboleto.cultura.pe; daily visitor numbers are capped." },
  jordanPass: { label: "Jordan Pass (Petra for a day, plus your Jordan visa fee)", amount: 70, currency: "JOD", source: "https://international.visitjordan.com/blog/external/7626/how-much-does-it-cost-to-go-to-petra-jordan/", note: "Buy before you land and stay at least two nights; Petra alone is 50 JOD." },
  tajMahal: { label: "Taj Mahal entry with the main mausoleum (foreign visitors)", amount: 1500, currency: "INR", source: "https://tajmahal.gov.in/visiting-hours.aspx", note: "₹1,300 entry plus ₹200 for the mausoleum." },
  chichenItza: { label: "Chichén Itzá entry (federal and state fees, foreign visitors)", amount: 697, currency: "MXN", source: "https://www.yucatan.com.mx/yucatan/2026/03/24/eliminan-el-doble-pago-para-entrar-a-chichen-itza-aplicaran-boleto-unico.html", note: "Yucatán raised this fee twice in 2026; check before you go." },
  colosseum: { label: "Colosseum, Roman Forum and Palatine Hill ticket", amount: 18, currency: "EUR", source: "https://visitrome.com/rome/travel-guides/the-colosseum-in-rome-complete-visitor-guide", note: "Buy on the official Colosseum site; resellers charge more." },
  redeemer: { label: "Corcovado train to Christ the Redeemer", amount: 134, currency: "BRL", source: "https://www.tremdocorcovado.rio/institutional/6/useful-information.html", note: "Adult fare on the official Trem do Corcovado site." },
  greatWall: { label: "Mutianyu Great Wall entry and round-trip cable car", amount: 31.8, currency: "USD", source: "https://www.expedia.com/things-to-do/a.a774084.activity-details", note: "A reseller's price; the gate price can be a little lower." },
  disneyland: { label: "Two one-park Disneyland tickets (mid-season days)", amount: 348, currency: "USD", low: 208, high: 448, source: "https://www.nerdwallet.com/travel/learn/disneyland-2026", note: "Day tickets run $104 to $224 by date; this uses $174 a day." },
});

// Guided trips sold as one price per person (sharing a cabin or tent).
export const PACKAGES = Object.freeze({
  antarctica: {
    label: "Antarctic Peninsula expedition ship from Ushuaia",
    airport: "USH",
    city: "Antarctic Peninsula",
    country: "Antarctica",
    nights: 10,
    perPerson: { low: 9006, typical: 10075, high: 18783 },
    includes: "Your cabin, all meals on board, Zodiac landings and the expedition team. Sailings run November to March.",
    sources: ["https://chimuadventures.com/en/antarctica/next-season-cruises", "https://www.taoticket.com/en_AU/co/quark-expeditions/na/ocean-explorer/december"],
    note: "Small-ship sailings start around $9,000 a person; bigger-name ships with balconies run $16,500 to $18,800, and the most luxurious over $26,000.",
    seasonMonths: [11, 12, 1, 2, 3],
  },
  mauritania: {
    label: "Guided 7-day Sahara tour from Nouakchott (Adrar, Chinguetti, Ouadane)",
    airport: "NKC",
    city: "Mauritanian Sahara",
    country: "Mauritania",
    nights: 6,
    perPerson: { low: 1629, typical: 1988, high: 2195 },
    includes: "A local guide, a 4x4 and nights in desert camps and guesthouses. Check each operator's list of meals and whether the iron ore train ride is included.",
    sources: ["https://tourradar.com/c/small-group-tours-mauritania"],
    note: "Operators listed these 7-day trips at $1,629 to $2,195 a person. Most need at least two travelers.",
    seasonMonths: [11, 12, 1, 2, 3],
  },
});

export const THEME_GROUPS = Object.freeze([
  { id: "wellness", title: "Wellness, peace and escaping everything", short: "Slow down" },
  { id: "nightlife", title: "Nightlife, parties and unforgettable weekends", short: "Stay out late" },
  { id: "local", title: "Living like a local", short: "Live there" },
  { id: "adventure", title: "Adventure, nature and once-in-a-lifetime", short: "Go big" },
  { id: "romance", title: "Food, romance and beautiful little escapes", short: "Fall in love" },
  { id: "just-because", title: "Just because", short: "Pure fun" },
]);

const t = (n, slug, group, title, place, days, stops, hook, highlights, bestMonths, more = {}) => ({ n, slug, group, title, place, days, stops, hook, highlights, bestMonths, ...more });

export const THEMED_TRIPS = Object.freeze([
  // Wellness, peace and escaping everything
  t(1, "green-juice-and-yoga", "wellness", "Green juice & yoga", "Ubud, Bali, Indonesia", 5, [{ id: "DPS", nights: 4 }], "Morning yoga above the rice fields, cold-pressed juice by nine, nothing on the calendar after that.", ["A drop-in class at one of Ubud's open-air yoga studios", "The Campuhan Ridge Walk at sunrise", "A Balinese massage and a flower bath", "The Tegallalang rice terraces before the crowds", "Juice bars and plant-based cafés along Jalan Goutama"], [4, 5, 6, 9, 10], { photo: "ubud", pricedFrom: "Bali" }),
  t(2, "a-silent-life-in-japan", "wellness", "A silent life in Japan", "Takayama, Japan", 30, [{ id: "takayama-fcf29", nights: 29 }], "A month in an Edo-era mountain town: morning markets, quiet temples, and evenings in a hot spring.", ["The Miyagawa and Jinya-mae morning markets", "Sanmachi Suji's old merchant streets", "Day trips to Shirakawa-go's thatched villages", "Onsen evenings in Okuhida", "A simple routine: same café, same walk, same bathhouse"], [4, 5, 10, 11]),
  t(3, "barefoot-and-unbothered", "wellness", "Barefoot & unbothered", "Koh Lipe, Thailand", 10, [{ id: "langkawi-ff3ea", nights: 9 }], "No cars, no shoes, one walking street and water so clear you'll see your feet.", ["Snorkeling straight off Sunrise Beach", "A longtail boat to Koh Adang's viewpoint", "Sunset on Pattaya Beach", "Fresh seafood on Walking Street", "Doing absolutely nothing in a hammock"], [12, 1, 2, 3, 4], { photo: "kohLipe", pricedFrom: "Langkawi, Malaysia (the ferry to Koh Lipe leaves from there)" }),
  t(4, "the-art-of-doing-nothing", "wellness", "The art of doing nothing", "Sidemen, Bali, Indonesia", 7, [{ id: "DPS", nights: 6 }], "A green valley under Mount Agung where the only plan is a long lunch and a longer view.", ["Rice-terrace walks with a local guide", "A weaving workshop in a family songket house", "Infinity-pool afternoons facing the volcano", "Cooking class with market ingredients", "Sunrise over Mount Agung"], [4, 5, 6, 9, 10], { photo: "sidemen", pricedFrom: "Bali" }),
  t(5, "disappear-into-the-jungle", "wellness", "Disappear into the jungle", "Munduk, Bali, Indonesia", 5, [{ id: "DPS", nights: 4 }], "Cool highland air, waterfalls in the forest, and coffee grown on the hill you're sleeping on.", ["The Munduk, Melanting and Banyumala waterfalls", "Twin lakes Buyan and Tamblingan by canoe", "A clove and coffee plantation walk", "Ulun Danu Beratan temple on the lake", "Misty mornings with nowhere to be"], [4, 5, 6, 7, 8, 9], { photo: "munduk", pricedFrom: "Bali" }),
  t(6, "a-slower-kind-of-morning", "wellness", "A slower kind of morning", "Chiang Mai, Thailand", 14, [{ id: "CNX", nights: 13 }], "Two weeks of temple bells, coffee in the old city and a massage every afternoon.", ["Wat Phra That Doi Suthep at dawn", "A Thai cooking class with a market tour", "An ethical elephant sanctuary day", "Nimmanhaemin's coffee shops", "The Sunday Walking Street market"], [11, 12, 1, 2]),
  t(7, "reset-by-the-ocean", "wellness", "Reset by the ocean", "Algarve, Portugal", 7, [{ id: "faro-a4951", nights: 6 }], "Golden cliffs, sea caves and long swims in the Atlantic, with grilled fish for dinner.", ["The Seven Hanging Valleys trail", "A boat into the Benagil sea cave", "Ponta da Piedade's sea stacks at sunset", "The old towns of Tavira and Lagos", "Sea yoga and surf lessons in Sagres"], [5, 6, 9, 10], { photo: "algarve", pricedFrom: "Faro" }),
  t(8, "off-the-grid", "wellness", "Off the grid", "Finnish Lakeland, Finland", 10, [{ id: "helsinki-c909b", nights: 9 }], "A lakeside cabin, a wood-fired sauna and a cold lake to jump into, repeated for ten days.", ["A rented cabin with its own sauna on Lake Saimaa", "Paddling Linnansaari National Park", "Savonlinna's Olavinlinna castle", "Berry picking under the midnight sun", "Two nights in Helsinki at the start"], [6, 7, 8], { photo: "saimaa", pricedFrom: "Helsinki" }),
  t(9, "mountain-air-and-matcha", "wellness", "Mountain air & matcha", "Hakone, Japan", 5, [{ id: "hakone-fcf29", nights: 4 }], "Onsen with Mount Fuji in the view, a tea ceremony, and a ryokan dinner served in your room.", ["A ryokan with its own hot spring", "Lake Ashi by boat with Fuji behind it", "The Hakone Open-Air Museum", "Owakudani's steaming valley", "A matcha tea ceremony"], [3, 4, 10, 11]),
  t(10, "eat-sleep-swim-repeat", "wellness", "Eat, sleep, swim, repeat", "Nusa Lembongan, Indonesia", 7, [{ id: "DPS", nights: 6 }], "A tiny island off Bali with mangroves, manta rays and beach bars at sunset.", ["Snorkeling with manta rays at Manta Point", "The Devil's Tear cliffs", "Mangroves by kayak", "The yellow bridge to Nusa Ceningan", "Every sunset at a different beach bar"], [4, 5, 6, 7, 8, 9, 10], { photo: "lembongan", pricedFrom: "Bali (a 30-minute boat from Sanur)" }),

  // Nightlife, parties and unforgettable weekends
  t(11, "party-like-a-pharaoh", "nightlife", "Party like a pharaoh", "Cairo, Egypt", 5, [{ id: "cairo-1c39a", nights: 4 }], "Pyramids by day, Nile rooftops by night, and a city that doesn't really go to sleep.", ["The Pyramids of Giza and the Sphinx", "The Grand Egyptian Museum", "A felucca on the Nile at sunset", "Rooftop bars in Zamalek", "Khan el-Khalili after midnight"], [10, 11, 12, 1, 2, 3]),
  t(12, "72-hours-in-ibiza", "nightlife", "72 hours in Ibiza", "Ibiza, Spain", 3, [{ id: "mallorca-20a8d", nights: 2 }], "Three days, two nights and one very big sunset at Café del Mar.", ["Sunset in Sant Antoni", "A superclub night", "Dalt Vila's old walls", "A beach club at Playa d'en Bossa", "A boat to Formentera to recover"], [6, 7, 8, 9], { photo: "ibiza", pricedFrom: "Mallorca, a neighboring Balearic island (Ibiza's summer prices run higher)" }),
  t(13, "after-dark-in-tokyo", "nightlife", "After dark in Tokyo", "Tokyo, Japan", 7, [{ id: "HND", nights: 6 }], "Neon alleys, eight-seat bars and karaoke until the trains start again.", ["Golden Gai's tiny bars", "Shibuya Crossing and Shibuya Sky at night", "Izakaya hopping in Omoide Yokocho", "Karaoke in Shinjuku", "Jazz kissa and listening bars"], [3, 4, 10, 11]),
  t(14, "the-weekend-never-ended", "nightlife", "The weekend never ended", "Berlin, Germany", 5, [{ id: "berlin-17d53", nights: 4 }], "Clubs that open Friday and close Monday, and a city that's fine with that.", ["A night at one of Berlin's famous techno clubs", "The East Side Gallery", "Late kebabs in Kreuzberg", "A Sunday at Mauerpark", "Recovery brunch in Neukölln"], [5, 6, 7, 8, 9]),
  t(15, "nights-on-the-riviera", "nightlife", "Nights on the Riviera", "Nice & Monaco, France / Monaco", 7, [{ id: "nice-e3772", nights: 6 }], "Promenade by day, Monte-Carlo by night, and the train between them is 20 minutes.", ["The Promenade des Anglais", "An evening at Monte-Carlo's casino square", "Old Nice's Cours Saleya market", "Èze village above the sea", "Beach clubs in Villefranche"], [5, 6, 9]),
  t(16, "sleep-when-youre-home", "nightlife", "Sleep when you're home", "Bangkok, Thailand", 5, [{ id: "BKK", nights: 4 }], "Rooftop bars, night markets and street food at 3 a.m.", ["Sky bars over the Chao Phraya", "Yaowarat's street food at night", "Jodd Fairs night market", "Thonglor's cocktail bars", "Wat Arun at golden hour"], [11, 12, 1, 2]),
  t(17, "summer-without-a-curfew", "nightlife", "Summer without a curfew", "Mykonos, Greece", 7, [{ id: "mykonos-4902a", nights: 6 }], "Whitewashed lanes, windmills at sunset and beach parties that start at five.", ["Sunset in Little Venice", "Paradise and Super Paradise beaches", "The windmills of Kato Mili", "A day trip to Delos", "Mykonos Town's late bars"], [6, 7, 8, 9]),
  t(18, "dancing-until-sunrise", "nightlife", "Dancing until sunrise", "Rio de Janeiro, Brazil", 7, [{ id: "GIG", nights: 6 }], "Samba in Lapa, caipirinhas in Ipanema and sunrise from the beach.", ["Samba nights in Lapa", "Christ the Redeemer", "Sugarloaf Mountain at sunset", "Ipanema and Copacabana", "A Friday street party in Pedra do Sal"], [12, 1, 2, 3], { extras: ["redeemer"] }),
  t(19, "a-weekend-in-vegas", "nightlife", "A weekend in Vegas", "Las Vegas, USA", 3, [{ id: "las-vegas-76868", nights: 2 }], "The Strip, one big show and one bad decision you'll talk about for years.", ["A headline show on the Strip", "The Bellagio fountains", "Fremont Street at night", "A pool party", "A sunrise drive to Red Rock Canyon"], [3, 4, 5, 10, 11]),
  t(20, "the-city-after-midnight", "nightlife", "The city after midnight", "New York City, USA", 5, [{ id: "JFK", nights: 4 }], "Jazz in the Village, a rooftop in Brooklyn and a slice at 2 a.m.", ["A late set at a Village jazz club", "Brooklyn rooftop bars", "Times Square after midnight", "A speakeasy on the Lower East Side", "The Brooklyn Bridge at dawn"], [4, 5, 6, 9, 10, 12]),

  // Living like a local
  t(21, "an-italian-life", "local", "An Italian life", "Florence, Italy", 30, [{ id: "FLR", nights: 29 }], "A month with a local market, a usual café and Sunday lunches that take all afternoon.", ["Your own stall at the Sant'Ambrogio market", "An Italian class three mornings a week", "Day trips to Siena, Lucca and Chianti", "Aperitivo in Santo Spirito", "The Uffizi when you feel like it, not all at once"], [4, 5, 9, 10]),
  t(22, "a-little-life-in-ireland", "local", "A little life in Ireland", "Dingle, Ireland", 30, [{ id: "wild-atlantic-way-eb213", nights: 29 }], "A month in a fishing town with pubs full of music and a coast that changes every hour.", ["Live trad music in Dingle's pubs", "The Slea Head Drive", "A boat out to the Blasket Islands", "Walking the Dingle Way", "Seafood chowder at the harbor"], [5, 6, 7, 8, 9], { photo: "dingle", pricedFrom: "the Wild Atlantic Way" }),
  t(23, "somewhere-in-the-french-countryside", "local", "Somewhere in the French countryside", "Provence, France", 21, [{ id: "MRS", nights: 20 }], "Lavender, village markets and a rosé that tastes better because you bought it at the farm.", ["Lavender fields around Valensole", "Market days in L'Isle-sur-la-Sorgue", "The hilltop villages of the Luberon", "Wine tasting in Châteauneuf-du-Pape", "A pétanque game in the square"], [5, 6, 7, 9]),
  t(24, "mornings-in-paris", "local", "Mornings in Paris", "Paris, France", 14, [{ id: "CDG", nights: 13 }], "Two weeks with your own boulangerie, your own café and your own bench by the Seine.", ["Your neighborhood market every morning", "A long walk along the Canal Saint-Martin", "Musée d'Orsay on a quiet weekday", "Picnics in the Luxembourg Garden", "The Eiffel Tower lighting up at night"], [4, 5, 6, 9, 10]),
  t(25, "a-month-in-kyoto", "local", "A month in Kyoto", "Kyoto, Japan", 30, [{ id: "KIX", nights: 29 }], "A machiya townhouse, a bike, and a temple for every morning of the month.", ["Fushimi Inari before the crowds", "Nishiki Market for groceries", "A tea ceremony in Gion", "Day trips to Nara and Osaka", "The Philosopher's Path by bike"], [3, 4, 10, 11]),
  t(26, "living-by-the-mediterranean", "local", "Living by the Mediterranean", "Crete, Greece", 30, [{ id: "crete-4902a", nights: 29 }], "A month of village tavernas, mountain gorges and a different beach every day.", ["Hiking the Samaria Gorge", "Chania's Venetian harbor", "Elafonisi's pink-sand beach", "Knossos, the Minoan palace", "Raki and meze in a mountain village"], [5, 6, 9, 10]),
  t(27, "the-portuguese-way-of-life", "local", "The Portuguese way of life", "Porto, Portugal", 21, [{ id: "porto-a4951", nights: 20 }], "Three weeks of tiled streets, port lodges and slow trains up the Douro.", ["Port tasting in Vila Nova de Gaia", "A day in the Douro Valley's vineyards", "Livraria Lello and the Ribeira", "Sunset at the Jardim do Morro", "A francesinha, at least once"], [5, 6, 9, 10]),
  t(28, "a-cabin-in-the-alps", "local", "A cabin in the Alps", "Innsbruck region, Austria", 14, [{ id: "innsbruck-59390", nights: 13 }], "Two weeks with mountains outside the window, hut lunches and cable cars from the city.", ["The Nordkette cable car from downtown", "Alpine hut hikes in the Stubai Valley", "The Swarovski Crystal Worlds", "A day in Hallstatt or Salzburg", "Skiing in winter, wildflowers in summer"], [1, 2, 6, 7, 8, 9]),
  t(29, "the-spanish-afternoon", "local", "The Spanish afternoon", "Seville, Spain", 14, [{ id: "seville-20a8d", nights: 13 }], "Long lunches, a siesta, flamenco at ten and tapas until one.", ["The Real Alcázar", "Plaza de España", "Flamenco in Triana", "Tapas crawls in Santa Cruz", "Day trips to Córdoba and Cádiz"], [3, 4, 5, 10, 11]),
  t(30, "a-different-life-in-buenos-aires", "local", "A different life in Buenos Aires", "Buenos Aires, Argentina", 30, [{ id: "EZE", nights: 29 }], "A month of tango, steak dinners at midnight and Sunday markets in San Telmo.", ["Tango classes and a milonga", "The San Telmo Sunday market", "An asado at a parrilla", "Recoleta and Palermo by bike", "A ferry day trip to Colonia, Uruguay"], [3, 4, 5, 10, 11]),

  // Adventure, nature and once-in-a-lifetime
  t(31, "the-edge-of-the-world", "adventure", "The edge of the world", "Patagonia, Argentina", 14, [{ id: "FTE", nights: 13 }], "Glaciers you can hear crack, granite towers and wind that tells you where you are.", ["Perito Moreno Glacier", "Hiking to Laguna de los Tres under Fitz Roy", "El Chaltén's trails", "Boating among icebergs on Lago Argentino", "A Patagonian lamb asado"], [11, 12, 1, 2, 3]),
  t(32, "chasing-the-northern-lights", "adventure", "Chasing the northern lights", "Tromsø, Norway", 7, [{ id: "troms-98845", nights: 6 }], "Seven long Arctic nights for the best chance at the aurora, plus huskies, fjords and reindeer.", ["A northern lights chase with a guide", "Husky sledding", "A Sámi reindeer camp", "The Fjellheisen cable car", "Whale watching in winter"], [10, 11, 12, 1, 2, 3]),
  t(33, "the-great-sahara-crossing", "adventure", "The great Sahara crossing", "Mauritania", 7, [{ package: "mauritania" }], "Ancient desert libraries, dunes as tall as buildings, and one of the world's longest trains.", ["The old libraries of Chinguetti", "Ouadane's stone ruins", "The Terjit oasis", "Nights in a desert camp", "The iron ore train, where operators still offer it"], [11, 12, 1, 2, 3], { photo: "chinguetti" }),
  t(34, "ancient-wonders", "adventure", "Ancient wonders", "Cairo & Luxor, Egypt", 10, [{ id: "cairo-1c39a", nights: 5 }, { id: "luxor-1c39a", nights: 4 }], "The last standing wonder of the ancient world, then the Valley of the Kings.", ["The Pyramids of Giza", "The Grand Egyptian Museum", "Karnak and Luxor temples", "The Valley of the Kings", "A hot-air balloon over the West Bank at dawn"], [10, 11, 12, 1, 2, 3]),
  t(35, "lost-city-of-petra", "adventure", "Lost city of Petra", "Petra & Wadi Rum, Jordan", 5, [{ id: "wadi-musa-67402", nights: 2 }, { id: "wadi-rum-67402", nights: 2 }], "Walk the Siq to the Treasury, then sleep under the stars in a red desert.", ["The Siq and the Treasury", "The climb to the Monastery", "Petra by Night (on its nights)", "A jeep tour of Wadi Rum", "A night in a Bedouin camp"], [3, 4, 5, 10, 11], { extras: ["jordanPass"], photo: "petra" }),
  t(36, "wild-in-south-africa", "adventure", "Wild in South Africa", "Kruger region, South Africa", 7, [{ id: "kruger-national-park-35fda", nights: 6 }], "Dawn game drives for the Big Five and dinners around a fire under southern stars.", ["Morning and evening game drives", "A guided bush walk", "The Panorama Route and Blyde River Canyon", "A night drive for leopards", "A braai under the stars"], [5, 6, 7, 8, 9, 10]),
  t(37, "the-land-of-fire-and-ice", "adventure", "The land of fire and ice", "Iceland", 10, [{ id: "reykjavik-b3c92", nights: 9 }], "Waterfalls, glaciers, black-sand beaches and a hot spring at the end of every day.", ["The Golden Circle", "Seljalandsfoss and Skógafoss", "Reynisfjara's black sand", "A glacier hike or ice cave", "The Jökulsárlón iceberg lagoon"], [6, 7, 8, 9]),
  t(38, "above-the-clouds", "adventure", "Above the clouds", "Swiss Alps, Switzerland", 7, [{ id: "interlaken-77dcd", nights: 6 }], "Cogwheel trains, glacier views and lakes so blue they look edited.", ["Jungfraujoch, the Top of Europe", "Lauterbrunnen's waterfall valley", "Paragliding over Interlaken", "Lake Brienz by boat", "A day in Grindelwald"], [6, 7, 8, 9]),
  t(39, "the-road-to-machu-picchu", "adventure", "The road to Machu Picchu", "Cusco, Peru", 10, [{ id: "cusco-36c57", nights: 6 }, { id: "machu-picchu-36c57", nights: 3 }], "Acclimatize in Cusco, take the train down the Sacred Valley, and be at the gates when they open.", ["Cusco's San Blas neighborhood", "The Sacred Valley: Pisac and Ollantaytambo", "The train to Aguas Calientes", "Machu Picchu at opening time", "Rainbow Mountain, if you're feeling strong"], [4, 5, 6, 9, 10], { extras: ["machuPicchu"], notPriced: ["The train between Cusco and Aguas Calientes (PeruRail or Inca Rail): check fares for your date."] }),
  t(40, "the-last-continent", "adventure", "The last continent", "Antarctic Peninsula", 12, [{ id: "ushuaia-354bf", nights: 1 }, { package: "antarctica" }], "Penguins, whales and ice the size of cities, from a small expedition ship.", ["Crossing the Drake Passage", "Zodiac landings among penguin colonies", "Whales in the Gerlache Strait", "Kayaking or camping on the ice (on some ships)", "A night in Ushuaia, the end of the world"], [11, 12, 1, 2, 3], { photo: "antarctica" }),

  // Food, romance and beautiful little escapes
  t(41, "lemons-and-late-lunches", "romance", "Lemons & late lunches", "Amalfi Coast, Italy", 7, [{ id: "NAP", nights: 6 }], "Cliffside towns, limoncello and lunches that start at two and end at six.", ["Positano by the water", "The Path of the Gods", "A boat to Capri", "Ravello's gardens", "Lemon groves and limoncello in Amalfi"], [5, 6, 9, 10]),
  t(42, "coffee-and-croissants", "romance", "Coffee and croissants", "Paris, France", 5, [{ id: "CDG", nights: 4 }], "Five Paris mornings in a row, and every one of them starts at a different bakery.", ["A pastry crawl in the Marais", "Montmartre at sunrise", "A Seine cruise at night", "The Louvre's quiet wings", "Dinner at a classic bistro"], [4, 5, 6, 9, 10]),
  t(43, "a-taste-of-tokyo", "romance", "A taste of Tokyo", "Tokyo, Japan", 7, [{ id: "HND", nights: 6 }], "Sushi at the counter, ramen at midnight and the best convenience-store snacks on earth.", ["The Tsukiji Outer Market for breakfast", "A sushi counter omakase", "Depachika food halls", "Ramen in Shinjuku", "A sake tasting"], [3, 4, 10, 11]),
  t(44, "pasta-wine-and-no-plans", "romance", "Pasta, wine & no plans", "Tuscany, Italy", 10, [{ id: "siena-ad79e", nights: 9 }], "Cypress roads, hilltop towns and a farmhouse table that's always set for two more.", ["Wine tasting in Chianti", "Siena's Piazza del Campo", "San Gimignano's towers", "A pasta-making class at a farm", "The Val d'Orcia at sunset"], [5, 6, 9, 10], { photo: "tuscany", pricedFrom: "Siena" }),
  t(45, "the-perfect-rainy-weekend", "romance", "The perfect rainy weekend", "London, England", 5, [{ id: "LHR", nights: 4 }], "Museums, pubs with fireplaces and a theater show to finish.", ["The British Museum and National Gallery (both free)", "Afternoon tea", "A West End show", "Borough Market", "A Sunday roast in a cozy pub"], [10, 11, 12, 1, 2, 3]),
  t(46, "chocolate-and-the-alps", "romance", "Chocolate & the Alps", "Lucerne, Switzerland", 5, [{ id: "lucerne-77dcd", nights: 4 }], "A lake, a wooden bridge, a mountain by cogwheel train, and more chocolate than you planned.", ["The Chapel Bridge", "Mount Pilatus by the world's steepest cogwheel railway", "A Swiss chocolate workshop", "A lake steamer to Vitznau", "Mount Rigi at sunset"], [5, 6, 7, 8, 9, 12]),
  t(47, "midnight-in-vienna", "romance", "Midnight in Vienna", "Vienna, Austria", 5, [{ id: "vienna-59390", nights: 4 }], "Coffeehouses, waltzes, a night at the opera and cake at every one of them.", ["A night at the State Opera", "Café Central and Sachertorte", "Schönbrunn Palace", "The Christmas markets in December", "Wine taverns in Grinzing"], [4, 5, 9, 10, 12]),
  t(48, "the-greek-island-summer", "romance", "The Greek island summer", "Paros, Greece", 10, [{ id: "paros-4902a", nights: 9 }], "Blue doors, quiet beaches and dinners by the water in a fishing harbor.", ["Naoussa's little harbor", "Kolymbithres' rock beaches", "A ferry day to Antiparos", "Lefkes, the hill village", "Sunset in Parikia"], [6, 7, 8, 9]),
  t(49, "breakfast-in-copenhagen", "romance", "Breakfast in Copenhagen", "Copenhagen, Denmark", 5, [{ id: "copenhagen-89da1", nights: 4 }], "Cardamom buns, bikes and the city that made cozy a whole lifestyle.", ["Cardamom buns from a famous bakery", "Nyhavn's colorful harbor", "Tivoli Gardens at night", "A harbor swim (yes, really)", "New Nordic dinner"], [5, 6, 7, 8, 12]),
  t(50, "a-little-romance-in-prague", "romance", "A little romance in Prague", "Prague, Czechia", 5, [{ id: "prague-1fef4", nights: 4 }], "Cobblestones, candlelit cellars and the Charles Bridge before anyone else is awake.", ["The Charles Bridge at sunrise", "Prague Castle", "Old Town Square's clock", "Dinner in a vaulted cellar", "A Vltava river cruise"], [4, 5, 9, 10, 12]),

  // Just because
  t(51, "disneyland-just-because", "just-because", "Disneyland, just because", "Anaheim, California, USA", 5, [{ id: "los-angeles-76868", nights: 4 }], "Two full days at the original Disney park, plus a beach and the Hollywood sign.", ["Sleeping Beauty Castle and Main Street, U.S.A.", "Disney California Adventure", "The fireworks at night", "A day at Santa Monica", "Griffith Observatory for the city view"], [1, 2, 9, 10, 11], { extras: ["disneyland"], photo: "disneyland", pricedFrom: "Los Angeles (Anaheim is 40 minutes away)" }),
]);

// The New Seven Wonders of the World, each with the GlobTrek destination it's
// visited from and its published entry price.
export const SEVEN_WONDERS = Object.freeze([
  { slug: "colosseum", name: "The Colosseum", where: "Rome, Italy", id: "FCO", nights: 3, extra: "colosseum", photo: "colosseum", line: "Gladiators, emperors and 2,000 years of Rome in one arena." },
  { slug: "petra", name: "Petra", where: "Jordan", id: "wadi-musa-67402", nights: 2, extra: "jordanPass", photo: "petra", line: "A city carved into rose-red cliffs, reached through a narrow canyon." },
  { slug: "taj-mahal", name: "The Taj Mahal", where: "Agra, India", id: "agra-967ce", nights: 2, extra: "tajMahal", line: "A marble love letter that changes color with the light." },
  { slug: "great-wall", name: "The Great Wall of China", where: "Beijing, China", id: "beijing-d2eaf", nights: 4, extra: "greatWall", photo: "greatWall", line: "Walk a restored section through the hills north of Beijing." },
  { slug: "chichen-itza", name: "Chichén Itzá", where: "Yucatán, Mexico", id: "merida-41937", nights: 3, extra: "chichenItza", photo: "chichen", line: "The great Maya pyramid of El Castillo, 90 minutes from Mérida." },
  { slug: "machu-picchu", name: "Machu Picchu", where: "Cusco, Peru", id: "machu-picchu-36c57", nights: 4, extra: "machuPicchu", line: "The Inca citadel in the clouds, after a few days in Cusco to adjust." },
  { slug: "christ-the-redeemer", name: "Christ the Redeemer", where: "Rio de Janeiro, Brazil", id: "GIG", nights: 3, extra: "redeemer", photo: "redeemer", line: "Arms open over Rio, 700 meters up on Corcovado." },
]);

// The seven continents, in the order a round-the-world trip flows (eastward),
// each with the stops added as the trip gets longer.
export const CONTINENT_STOPS = Object.freeze([
  { continent: "North America", stops: ["JFK", "cancun-41937", "los-angeles-76868", "orlando-76868"] },
  { continent: "Europe", stops: ["CDG", "FCO", "LIS", "athens-4902a", "prague-1fef4"] },
  { continent: "Africa", stops: ["CPT", "RAK", "kruger-national-park-35fda", "cairo-1c39a"] },
  { continent: "Asia", stops: ["HND", "BKK", "DPS", "KIX", "HAN"] },
  { continent: "Oceania", stops: ["SYD", "queenstown-a2238", "auckland-a2238"] },
  { continent: "South America", stops: ["EZE", "cusco-36c57", "GIG", "santiago-34950"] },
  { continent: "Antarctica", package: "antarctica" },
]);

export const THEMED_CHECKED = CHECKED;

export function themedTrip(slug) {
  return THEMED_TRIPS.find((trip) => trip.slug === slug) || null;
}
