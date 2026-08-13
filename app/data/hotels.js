const hotelCatalog = {
  "KYOTO": ["Aman Kyoto", "The Shinmonzen", "Park Hyatt Kyoto", "Sowaka"],
  "TOKYO": ["Aman Tokyo", "Trunk Hotel Yoyogi Park", "Hoshinoya Tokyo", "The Tokyo Edition, Toranomon"],
  "SEOUL": ["Josun Palace", "Signiel Seoul", "Four Seasons Hotel Seoul", "RYSE, Autograph Collection"],
  "BANGKOK": ["Capella Bangkok", "The Siam", "Mandarin Oriental Bangkok", "The Standard, Bangkok Mahanakhon"],
  "CHIANG MAI": ["137 Pillars House", "Anantara Chiang Mai Resort", "Raya Heritage", "Four Seasons Resort Chiang Mai"],
  "BALI": ["Potato Head Suites", "Capella Ubud, Bali", "Amankila", "The Slow"],
  "SINGAPORE": ["Raffles Singapore", "The Singapore EDITION", "Capella Singapore", "The Warehouse Hotel"],
  "HANOI": ["Sofitel Legend Metropole Hanoi", "Capella Hanoi", "Peridot Grand Luxury Boutique Hotel", "Hotel de l'Opera Hanoi"],
  "MALDIVES": ["Soneva Jani", "The St. Regis Maldives Vommuli Resort", "Patina Maldives, Fari Islands", "Six Senses Laamu"],
  "DUBAI": ["Bulgari Resort Dubai", "One&Only The Palm", "The Lana - Dorchester Collection", "Atlantis The Royal"],
  "CAPE TOWN": ["The Silo Hotel", "Mount Nelson, A Belmond Hotel", "Ellerman House", "The Twelve Apostles Hotel and Spa"],
  "MARRAKECH": ["Royal Mansour Marrakech", "El Fenn", "La Mamounia", "Riad Yasmine"],
  "NAIROBI & THE MAASAI MARA": ["Giraffe Manor", "Hemingways Nairobi", "Angama Mara", "andBeyond Bateleur Camp"],
  "PARIS": ["Hôtel Costes", "Cheval Blanc Paris", "Hôtel Madame Rêve", "Le Bristol Paris"],
  "PROVENCE": ["Crillon le Brave", "Domaine de Fontenille", "Coquillade Provence", "La Bastide de Gordes"],
  "AMALFI COAST": ["Le Sirenuse", "Il San Pietro di Positano", "Borgo Santandrea", "Hotel Santa Caterina"],
  "ROME": ["Hotel de Russie", "Six Senses Rome", "Bulgari Hotel Roma", "Hotel Eden"],
  "FLORENCE": ["Hotel Savoy, a Rocco Forte Hotel", "Portrait Firenze", "Four Seasons Hotel Firenze", "The Place Firenze"],
  "SANTORINI": ["Canaves Oia Suites", "Katikies Santorini", "Perivolas Hotel", "Vora"],
  "LISBON": ["Bairro Alto Hotel", "Memmo Príncipe Real", "Palácio Príncipe Real", "Four Seasons Hotel Ritz Lisbon"],
  "BARCELONA": ["The Barcelona EDITION", "Hotel Arts Barcelona", "Cotton House Hotel", "Almanac Barcelona"],
  "ICELAND RING ROAD": ["The Retreat at Blue Lagoon Iceland", "ION Adventure Hotel", "Hotel Rangá", "Fosshotel Glacier Lagoon"],
  "LONDON": ["Claridge's", "The Connaught", "The London EDITION", "The Twenty Two"],
  "NEW YORK CITY": ["The Greenwich Hotel", "The Bowery Hotel", "Aman New York", "The Mercer"],
  "MEXICO CITY": ["Casa Polanco", "Octavia Casa", "The St. Regis Mexico City", "Downtown Mexico"],
  "TULUM": ["Be Tulum", "Nomade Tulum", "Hotel Esencia", "Casa Malca"],
  "COSTA RICA": ["Nayara Springs", "Four Seasons Resort Peninsula Papagayo", "Hacienda AltaGracia", "Lapa Rios Lodge"],
  "RIO DE JANEIRO": ["Emiliano Rio", "Hotel Fasano Rio de Janeiro", "Copacabana Palace, A Belmond Hotel", "Santa Teresa Hotel RJ - MGallery"],
  "BUENOS AIRES": ["Faena Hotel Buenos Aires", "Four Seasons Hotel Buenos Aires", "Palacio Duhau - Park Hyatt Buenos Aires", "Home Hotel Buenos Aires"],
  "PATAGONIA": ["The Singular Patagonia", "Awasi Patagonia", "Explora Patagonia", "EOLO - Patagonia's Spirit"],
  "BANFF": ["Fairmont Banff Springs", "Fairmont Chateau Lake Louise", "Moraine Lake Lodge", "The Rimrock Resort Hotel Banff"],
  "VANCOUVER": ["Rosewood Hotel Georgia", "Fairmont Pacific Rim", "Shangri-La Vancouver", "Wedgewood Hotel & Spa"],
  "MAUI": ["Hotel Wailea", "Four Seasons Resort Maui at Wailea", "Montage Kapalua Bay", "Andaz Maui at Wailea Resort"],
  "SYDNEY": ["Capella Sydney", "Park Hyatt Sydney", "Ace Hotel Sydney", "The Old Clare Hotel"],
  "NEW ZEALAND SOUTH ISLAND": ["The Lindis", "Blanket Bay", "Matakauri Lodge", "Flockhill Lodge"],
  "TAHITI & MOOREA": ["The Brando", "Sofitel Kia Ora Moorea Beach Resort", "Hilton Moorea Lagoon Resort & Spa", "Manava Beach Resort & Spa Moorea"],
};

const descriptors = ["The icon", "The design stay", "The quiet escape", "The scene"];

export function hotelsFor(destination) {
  return (hotelCatalog[destination.city] || []).map((name, index) => ({
    id: `${destination.airport}-${index + 1}`,
    name,
    descriptor: descriptors[index],
    image: destination.image,
  }));
}

export function hotelCount() {
  return Object.values(hotelCatalog).reduce((total, hotels) => total + hotels.length, 0);
}

export { hotelCatalog };
