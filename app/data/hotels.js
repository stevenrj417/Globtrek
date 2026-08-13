const hotelCatalog = {
  "KYOTO": [
    { name: "Six Senses Kyoto", bookingUrl: "https://www.booking.com/hotel/jp/six-senses-kyoto.html" },
    { name: "Park Hyatt Kyoto", bookingUrl: "https://www.booking.com/hotel/jp/park-hyatt-kyoto.html" },
    { name: "Four Seasons Hotel Kyoto", bookingUrl: "https://www.booking.com/hotel/jp/four-seasons-kyoto.html" },
    { name: "Sowaka", bookingUrl: "https://www.booking.com/hotel/jp/sowaka-jing-du-shi.html" },
  ],
  "TOKYO": [
    { name: "TRUNK(HOTEL) YOYOGI PARK", bookingUrl: "https://www.booking.com/hotel/jp/trunk-yoyogi-park.html" },
    { name: "The Tokyo EDITION, Toranomon", bookingUrl: "https://www.booking.com/hotel/jp/the-tokyo-edition-toranomon.html" },
    { name: "Palace Hotel Tokyo", bookingUrl: "https://www.booking.com/hotel/jp/palace-tokyo.html" },
    { name: "Mandarin Oriental, Tokyo", bookingUrl: "https://www.booking.com/hotel/jp/mandarin-oriental-tokyo.html" },
  ],
  "SEOUL": [
    { name: "Josun Palace", bookingUrl: "https://www.booking.com/hotel/kr/josun-palace-a-luxury-collection-seoul-gangnam.html" },
    { name: "Signiel Seoul", bookingUrl: "https://www.booking.com/hotel/kr/signiel-seoul.html" },
    { name: "Four Seasons Hotel Seoul", bookingUrl: "https://www.booking.com/hotel/kr/four-seasons-seoul.html" },
    { name: "RYSE, Autograph Collection", bookingUrl: "https://www.booking.com/hotel/kr/ryse-autograph-collection-korea.html" },
  ],
  "BANGKOK": [
    { name: "Capella Bangkok", bookingUrl: "https://www.booking.com/hotel/th/capella-bangkok.html" },
    { name: "The Siam", bookingUrl: "https://www.booking.com/hotel/th/the-siam.html" },
    { name: "Mandarin Oriental, Bangkok", bookingUrl: "https://www.booking.com/hotel/th/mandarin-oriental-bangkok.html" },
    { name: "The Standard, Bangkok Mahanakhon", bookingUrl: "https://www.booking.com/hotel/th/the-standard-bangkok-mahanakhon.html" },
  ],
  "CHIANG MAI": [
    { name: "137 Pillars House", bookingUrl: "https://www.booking.com/hotel/th/one-three-seven-pillars-house.html" },
    { name: "Anantara Chiang Mai Resort", bookingUrl: "https://www.booking.com/hotel/th/anantara-chiang-mai-resort-and-spa.html" },
    { name: "Raya Heritage", bookingUrl: "https://www.booking.com/hotel/th/raya-heritage.html" },
    { name: "Four Seasons Resort Chiang Mai", bookingUrl: "https://www.booking.com/hotel/th/four-seasons-resort-chiang-mai.html" },
  ],
  "BALI": [
    { name: "Bvlgari Resort Bali", bookingUrl: "https://www.booking.com/hotel/id/bulgari-hotels-resorts-bali.html" },
    { name: "Capella Ubud, Bali", bookingUrl: "https://www.booking.com/hotel/id/capella-ubud-bali-ubud-gianyar-bali.html" },
    { name: "Mandapa, a Ritz-Carlton Reserve", bookingUrl: "https://www.booking.com/hotel/id/mandapa-a-ritz-carlton-reserve.html" },
    { name: "The Slow", bookingUrl: "https://www.booking.com/hotel/id/the-slow.html" },
  ],
  "SINGAPORE": [
    { name: "Raffles Singapore", bookingUrl: "https://www.booking.com/hotel/sg/raffles.html" },
    { name: "The Singapore EDITION", bookingUrl: "https://www.booking.com/hotel/sg/the-singapore-edition-sm.html" },
    { name: "Capella Singapore", bookingUrl: "https://www.booking.com/hotel/sg/capella-singapore.html" },
    { name: "The Warehouse Hotel", bookingUrl: "https://www.booking.com/hotel/sg/the-warehouse.html" },
  ],
  "HANOI": [
    { name: "Sofitel Legend Metropole Hanoi", bookingUrl: "https://www.booking.com/hotel/vn/sofitelmetropole.html" },
    { name: "Capella Hanoi", bookingUrl: "https://www.booking.com/hotel/vn/capella-hoan-kiem.html" },
    { name: "Peridot Grand Luxury Boutique Hotel", bookingUrl: "https://www.booking.com/hotel/vn/peridot-grand-amp-spa-by-aira-hoan-kiem1.html" },
    { name: "Hotel de l'Opera Hanoi - MGallery", bookingUrl: "https://www.booking.com/hotel/vn/de-l-opera-hanoi-mgallery.html" },
  ],
  "MALDIVES": [
    { name: "Soneva Jani", bookingUrl: "https://www.booking.com/hotel/mv/soneva-jani.html" },
    { name: "The St. Regis Maldives Vommuli Resort", bookingUrl: "https://www.booking.com/hotel/mv/the-st-regis-maldives-vommuli-resort.html" },
    { name: "Patina Maldives, Fari Islands", bookingUrl: "https://www.booking.com/hotel/mv/patina-maldives-fari-islands-north-maldives.html" },
    { name: "Six Senses Laamu", bookingUrl: "https://www.booking.com/hotel/mv/six-senses-laamu.html" },
  ],
  "DUBAI": [
    { name: "Bvlgari Resort Dubai", bookingUrl: "https://www.booking.com/hotel/ae/bulgari-resorts-dubai.html" },
    { name: "One&Only The Palm Dubai", bookingUrl: "https://www.booking.com/hotel/ae/one-only-the-palm-dubai.html" },
    { name: "The Lana - Dorchester Collection", bookingUrl: "https://www.booking.com/hotel/ae/the-lana-dorchester-collection-dubai.html" },
    { name: "Atlantis The Royal", bookingUrl: "https://www.booking.com/hotel/ae/the-royal-atlantis.html" },
  ],
  "CAPE TOWN": [
    { name: "The Silo Hotel", bookingUrl: "https://www.booking.com/hotel/za/the-silo.html" },
    { name: "Mount Nelson, A Belmond Hotel", bookingUrl: "https://www.booking.com/hotel/za/belmond-mount-nelson.html" },
    { name: "Ellerman House", bookingUrl: "https://www.booking.com/hotel/za/ellerman-house.html" },
    { name: "Twelve Apostles Hotel & Spa", bookingUrl: "https://www.booking.com/hotel/za/twelve-apostles-spa.html" },
  ],
  "MARRAKECH": [
    { name: "Royal Mansour Marrakech", bookingUrl: "https://www.booking.com/hotel/ma/royal-mansour-marrakech.html" },
    { name: "El Fenn", bookingUrl: "https://www.booking.com/hotel/ma/riad-el-fenn.html" },
    { name: "Les Deux Tours", bookingUrl: "https://www.booking.com/hotel/ma/les-deux-tours.html" },
    { name: "La Villa des Orangers", bookingUrl: "https://www.booking.com/hotel/ma/villa-des-orangers.html" },
  ],
  "NAIROBI & THE MAASAI MARA": [
    { name: "Hemingways Nairobi", bookingUrl: "https://www.booking.com/hotel/ke/hemingways-nairobi.html" },
    { name: "JW Marriott Masai Mara Lodge", bookingUrl: "https://www.booking.com/hotel/ke/jw-marriott-masai-mara-lodge.html" },
    { name: "Mahali Mzuri", bookingUrl: "https://www.booking.com/hotel/ke/mahali-mzuri.html" },
    { name: "Fairmont Mara Safari Club", bookingUrl: "https://www.booking.com/hotel/ke/fairmont-mara-safari-club.html" },
  ],
  "PARIS": [
    { name: "Hotel de Crillon", bookingUrl: "https://www.booking.com/hotel/fr/de-crillon-paris.html" },
    { name: "Cheval Blanc Paris", bookingUrl: "https://www.booking.com/hotel/fr/cheval-blanc-paris.html" },
    { name: "Hôtel Madame Rêve", bookingUrl: "https://www.booking.com/hotel/fr/madame-reve-paris.html" },
    { name: "Le Bristol Paris", bookingUrl: "https://www.booking.com/hotel/fr/le-bristol-paris.html" },
  ],
  "PROVENCE": [
    { name: "Hotel Crillon le Brave", bookingUrl: "https://www.booking.com/hotel/fr/crillon-le-brave.html" },
    { name: "Domaine de Fontenille", bookingUrl: "https://www.booking.com/hotel/fr/domaine-de-fontenille.html" },
    { name: "Coquillade Provence", bookingUrl: "https://www.booking.com/hotel/fr/la-coquillade.html" },
    { name: "Airelles Gordes, La Bastide", bookingUrl: "https://www.booking.com/hotel/fr/la-bastide-de-gordes-spa.html" },
  ],
  "AMALFI COAST": [
    { name: "Le Sirenuse", bookingUrl: "https://www.booking.com/hotel/it/le-sirenuse.html" },
    { name: "Villa Treville", bookingUrl: "https://www.booking.com/hotel/it/villa-treville.html" },
    { name: "Borgo Santandrea", bookingUrl: "https://www.booking.com/hotel/it/borgo-santandrea.html" },
    { name: "Hotel Santa Caterina", bookingUrl: "https://www.booking.com/hotel/it/santa-caterina-amalfi.html" },
  ],
  "ROME": [
    { name: "Hotel de Russie", bookingUrl: "https://www.booking.com/hotel/it/de-russie.html" },
    { name: "Six Senses Rome", bookingUrl: "https://www.booking.com/hotel/it/six-senses-rome.html" },
    { name: "Bulgari Hotel Roma", bookingUrl: "https://www.booking.com/hotel/it/bulgari-roma.html" },
    { name: "Hotel Eden", bookingUrl: "https://www.booking.com/hotel/it/eden-roma.html" },
  ],
  "FLORENCE": [
    { name: "Hotel Savoy, a Rocco Forte Hotel", bookingUrl: "https://www.booking.com/hotel/it/savoy-firenze.html" },
    { name: "Portrait Firenze", bookingUrl: "https://www.booking.com/hotel/it/portrait-firenze.html" },
    { name: "Four Seasons Hotel Firenze", bookingUrl: "https://www.booking.com/hotel/it/four-seasons-firenze.html" },
    { name: "The Place Firenze", bookingUrl: "https://www.booking.com/hotel/it/the-place-firenze.html" },
  ],
  "SANTORINI": [
    { name: "Canaves Oia Suites", bookingUrl: "https://www.booking.com/hotel/gr/canaves-oia-suites.html" },
    { name: "Katikies Santorini", bookingUrl: "https://www.booking.com/hotel/gr/katikies.html" },
    { name: "Perivolas Hotel", bookingUrl: "https://www.booking.com/hotel/gr/peribolas.html" },
    { name: "Vora", bookingUrl: "https://www.booking.com/hotel/gr/vora.html" },
  ],
  "LISBON": [
    { name: "Bairro Alto Hotel", bookingUrl: "https://www.booking.com/hotel/pt/bairro-alto.html" },
    { name: "Memmo Príncipe Real", bookingUrl: "https://www.booking.com/hotel/pt/memmo-principe-real.html" },
    { name: "Palácio Príncipe Real", bookingUrl: "https://www.booking.com/hotel/pt/palacio-principe-real.html" },
    { name: "Four Seasons Hotel Ritz Lisbon", bookingUrl: "https://www.booking.com/hotel/pt/four-seasons-ritz-lisbon.html" },
  ],
  "BARCELONA": [
    { name: "The Barcelona EDITION", bookingUrl: "https://www.booking.com/hotel/es/the-barcelona-edition.html" },
    { name: "Hotel Arts Barcelona", bookingUrl: "https://www.booking.com/hotel/es/arts-barcelona.html" },
    { name: "Cotton House Hotel", bookingUrl: "https://www.booking.com/hotel/es/cotton-house-autograph-collection.html" },
    { name: "Almanac Barcelona", bookingUrl: "https://www.booking.com/hotel/es/almanac-barcelona-barcelona.html" },
  ],
  "ICELAND RING ROAD": [
    { name: "The Reykjavík EDITION", bookingUrl: "https://www.booking.com/hotel/is/the-reykjavik-edition.html" },
    { name: "ION Adventure Hotel", bookingUrl: "https://www.booking.com/hotel/is/fosshotel-hengill.html" },
    { name: "Hotel Rangá", bookingUrl: "https://www.booking.com/hotel/is/ranga-hella.html" },
    { name: "Fosshotel Glacier Lagoon", bookingUrl: "https://www.booking.com/hotel/is/fosshotel-glacier-lagoon.html" },
  ],
  "LONDON": [
    { name: "Claridge's", bookingUrl: "https://www.booking.com/hotel/gb/claridges.html" },
    { name: "The Connaught", bookingUrl: "https://www.booking.com/hotel/gb/the-connaught.html" },
    { name: "The London EDITION", bookingUrl: "https://www.booking.com/hotel/gb/the-london-edition.html" },
    { name: "The Twenty Two", bookingUrl: "https://www.booking.com/hotel/gb/the-twenty-two.html" },
  ],
  "NEW YORK CITY": [
    { name: "The Greenwich Hotel", bookingUrl: "https://www.booking.com/hotel/us/greenwich.html" },
    { name: "The Bowery Hotel", bookingUrl: "https://www.booking.com/hotel/us/the-bowery.html" },
    { name: "Aman New York", bookingUrl: "https://www.booking.com/hotel/us/aman-new-york.html" },
    { name: "The Mercer", bookingUrl: "https://www.booking.com/hotel/us/the-mercer.html" },
  ],
  "MEXICO CITY": [
    { name: "Casa Polanco", bookingUrl: "https://www.booking.com/hotel/mx/casa-polanco.html" },
    { name: "Octavia Casa", bookingUrl: "https://www.booking.com/hotel/mx/octavia-casa.html" },
    { name: "The St. Regis Mexico City", bookingUrl: "https://www.booking.com/hotel/mx/st-regis-mexico-city.html" },
    { name: "Downtown Mexico", bookingUrl: "https://www.booking.com/hotel/mx/downtown.html" },
  ],
  "TULUM": [
    { name: "Be Tulum", bookingUrl: "https://www.booking.com/hotel/mx/be-tulum.html" },
    { name: "Nomade Tulum", bookingUrl: "https://www.booking.com/hotel/mx/nomade-tulum.html" },
    { name: "Hotel Esencia", bookingUrl: "https://www.booking.com/hotel/mx/esencia.html" },
    { name: "Casa Malca", bookingUrl: "https://www.booking.com/hotel/mx/casa-malca.html" },
  ],
  "COSTA RICA": [
    { name: "Nayara Springs", bookingUrl: "https://www.booking.com/hotel/cr/nayara-springs.html" },
    { name: "Four Seasons Resort Peninsula Papagayo", bookingUrl: "https://www.booking.com/hotel/cr/four-seasons-resort-costa-rica-at-peninsula-papagayo.html" },
    { name: "Hacienda AltaGracia", bookingUrl: "https://www.booking.com/hotel/cr/altagracia-boutique-hacienda.html" },
    { name: "Lapa Rios Lodge", bookingUrl: "https://www.booking.com/hotel/cr/lapa-rios-ecolodge.html" },
  ],
  "RIO DE JANEIRO": [
    { name: "Emiliano Rio", bookingUrl: "https://www.booking.com/hotel/br/emiliano-rio.html" },
    { name: "Hotel Fasano Rio de Janeiro", bookingUrl: "https://www.booking.com/hotel/br/fasano-rio-de-janeiro.html" },
    { name: "Copacabana Palace, A Belmond Hotel", bookingUrl: "https://www.booking.com/hotel/br/copacabana-palace.html" },
    { name: "Santa Teresa Hotel RJ - MGallery", bookingUrl: "https://www.booking.com/hotel/br/santa-teresa.html" },
  ],
  "BUENOS AIRES": [
    { name: "Faena Hotel Buenos Aires", bookingUrl: "https://www.booking.com/hotel/ar/faena-buenos-aires.html" },
    { name: "Four Seasons Hotel Buenos Aires", bookingUrl: "https://www.booking.com/hotel/ar/four-seasons-buenos-aires.html" },
    { name: "Palacio Duhau - Park Hyatt Buenos Aires", bookingUrl: "https://www.booking.com/hotel/ar/palacio-duhau-park-hyatt-buenos-aires.html" },
    { name: "Home Hotel Buenos Aires", bookingUrl: "https://www.booking.com/hotel/ar/home.html" },
  ],
  "PATAGONIA": [
    { name: "The Singular Patagonia", bookingUrl: "https://www.booking.com/hotel/cl/the-singular-patagonia.html" },
    { name: "Awasi Patagonia", bookingUrl: "https://www.booking.com/hotel/cl/awasi-patagonia-torres-del-paine.html" },
    { name: "Explora Patagonia", bookingUrl: "https://www.booking.com/hotel/cl/explora-patagonia.html" },
    { name: "EOLO - Patagonia's Spirit", bookingUrl: "https://www.booking.com/hotel/ar/eolo-patagonias-spirit.html" },
  ],
  "BANFF": [
    { name: "Fairmont Banff Springs", bookingUrl: "https://www.booking.com/hotel/ca/the-fairmont-banff-springs.html" },
    { name: "Fairmont Chateau Lake Louise", bookingUrl: "https://www.booking.com/hotel/ca/the-fairmont-chateau-lake-louise.html" },
    { name: "Moraine Lake Lodge", bookingUrl: "https://www.booking.com/hotel/ca/moraine-lake-lodge.html" },
    { name: "The Rimrock Resort Hotel Banff", bookingUrl: "https://www.booking.com/hotel/ca/the-rimrock-resort.html" },
  ],
  "VANCOUVER": [
    { name: "Rosewood Hotel Georgia", bookingUrl: "https://www.booking.com/hotel/ca/rosewood-georgia.html" },
    { name: "Fairmont Pacific Rim", bookingUrl: "https://www.booking.com/hotel/ca/fairmont-pacific-rim.html" },
    { name: "Shangri-La Vancouver", bookingUrl: "https://www.booking.com/hotel/ca/shangri-la-vancouver.html" },
    { name: "Wedgewood Hotel & Spa", bookingUrl: "https://www.booking.com/hotel/ca/wedgewood.html" },
  ],
  "MAUI": [
    { name: "Hotel Wailea", bookingUrl: "https://www.booking.com/hotel/us/wailea.html" },
    { name: "Four Seasons Resort Maui at Wailea", bookingUrl: "https://www.booking.com/hotel/us/four-seasons-resort-maui-at-wailea.html" },
    { name: "Montage Kapalua Bay", bookingUrl: "https://www.booking.com/hotel/us/montage-kapalua-bay.html" },
    { name: "Andaz Maui at Wailea Resort", bookingUrl: "https://www.booking.com/hotel/us/andaz-maui-at-wailea.html" },
  ],
  "SYDNEY": [
    { name: "Capella Sydney", bookingUrl: "https://www.booking.com/hotel/au/capella-sydney.html" },
    { name: "Park Hyatt Sydney", bookingUrl: "https://www.booking.com/hotel/au/park-hyatt-sydney.html" },
    { name: "Ace Hotel Sydney", bookingUrl: "https://www.booking.com/hotel/au/ace-sydney.html" },
    { name: "The Old Clare Hotel", bookingUrl: "https://www.booking.com/hotel/au/the-old-clare.html" },
  ],
  "NEW ZEALAND SOUTH ISLAND": [
    { name: "The Lindis", bookingUrl: "https://www.booking.com/hotel/nz/the-lindis.html" },
    { name: "Blanket Bay", bookingUrl: "https://www.booking.com/hotel/nz/blanket-bay.html" },
    { name: "Rosewood Matakauri", bookingUrl: "https://www.booking.com/hotel/nz/matakauri-lodge-queenstown.html" },
    { name: "Flockhill Lodge", bookingUrl: "https://www.booking.com/hotel/nz/flockhill-lodge.html" },
  ],
  "TAHITI & MOOREA": [
    { name: "InterContinental Tahiti Resort & Spa", bookingUrl: "https://www.booking.com/hotel/pf/intercontinental-tahiti-resort.html" },
    { name: "Sofitel Kia Ora Moorea Beach Resort", bookingUrl: "https://www.booking.com/hotel/pf/sofitel-moorea-beach-resort.html" },
    { name: "Hilton Moorea Lagoon Resort & Spa", bookingUrl: "https://www.booking.com/hotel/pf/hilton-moorea-lagoon-resort-and-spa.html" },
    { name: "Manava Beach Resort & Spa Moorea", bookingUrl: "https://www.booking.com/hotel/pf/moorea-pearl-resort-and-spa.html" },
  ],
};

const descriptors = ["The icon", "The design stay", "The quiet escape", "The scene"];

export function hotelsFor(destination) {
  return (hotelCatalog[destination.city] || []).map((entry, index) => ({
    id: `${destination.airport}-${index + 1}`,
    ...(typeof entry === "string" ? { name: entry, bookingUrl: null } : entry),
    descriptor: descriptors[index],
    image: destination.image,
  }));
}

export function hotelCount() {
  return Object.values(hotelCatalog).reduce((total, hotels) => total + hotels.length, 0);
}

export { hotelCatalog };
