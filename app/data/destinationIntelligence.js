const DESTINATION_TYPES = new Set(["city", "island", "region", "country", "route", "nature_area", "resort_area", "multi_stop"]);

const typeMembers = {
  island: ["BALI", "MALDIVES", "MAUI", "SÃO MIGUEL ISLAND", "YAKUSHIMA", "JEJU ISLAND", "MENORCA", "ISLE OF SKYE", "SEYCHELLES", "BORA BORA", "GALÁPAGOS ISLANDS", "PORTO SANTO", "TENERIFE", "LANZAROTE", "SARDINIA", "CRETE", "MAURITIUS", "NOSY BE"],
  region: ["PROVENCE", "AMALFI COAST", "PATAGONIA", "NEW ZEALAND SOUTH ISLAND", "LOFOTEN", "LAKE COMO", "NORMANDY", "CAPPADOCIA"],
  country: ["COSTA RICA", "FIJI"],
  route: ["ICELAND RING ROAD"],
  nature_area: ["BANFF", "ATACAMA DESERT", "SERENGETI NATIONAL PARK", "SOSSUSVLEI", "METEORA"],
  resort_area: ["TULUM", "CANCÚN", "PHUKET", "ST. BARTS", "ASPEN", "PALM SPRINGS", "PUERTO VALLARTA", "MONTEGO BAY", "PUNTA DEL ESTE", "CHAMONIX", "INTERLAKEN", "ZERMATT", "ALULA"],
  multi_stop: ["NAIROBI & THE MAASAI MARA", "TAHITI & MOOREA", "VICTORIA FALLS"],
};

const destinationTypeByName = new Map(Object.entries(typeMembers).flatMap(([type, names]) => names.map((name) => [name, type])));
const searchOverrides = {
  "AMALFI COAST": ["Positano", "Amalfi", "Ravello", "Praiano"],
  BALI: ["Ubud", "Seminyak", "Canggu", "Nusa Dua", "Uluwatu"],
  BANFF: ["Banff", "Lake Louise", "Canmore"],
  "COSTA RICA": ["Arenal", "Papagayo Peninsula", "Manuel Antonio", "Osa Peninsula", "Nicoya Peninsula"],
  "ICELAND RING ROAD": ["Reykjavík", "Vík", "Höfn", "Egilsstaðir", "Akureyri", "Mývatn"],
  MALDIVES: ["North Malé Atoll", "South Malé Atoll", "Baa Atoll", "Ari Atoll", "Laamu Atoll"],
  MAUI: ["Wailea", "Kāʻanapali", "Kapalua", "Lāhainā", "Hāna"],
  "NAIROBI & THE MAASAI MARA": ["Nairobi", "Maasai Mara National Reserve", "Mara North Conservancy", "Olare Motorogi Conservancy"],
  "NEW ZEALAND SOUTH ISLAND": ["Queenstown", "Wānaka", "Christchurch", "Aoraki / Mount Cook", "Te Anau"],
  PATAGONIA: ["El Calafate", "El Chaltén", "Puerto Natales", "Torres del Paine"],
  PROVENCE: ["Avignon", "Aix-en-Provence", "Gordes", "Saint-Rémy-de-Provence", "Luberon"],
  "SERENGETI NATIONAL PARK": ["Central Serengeti", "Northern Serengeti", "Western Corridor", "Ngorongoro gateway"],
  "TAHITI & MOOREA": ["Papeete", "Punaauia", "Teva I Uta", "Maharepa", "Haapiti"],
  "VICTORIA FALLS": ["Victoria Falls, Zimbabwe", "Livingstone, Zambia"],
};

const legacyCostLevels = {
  KIX: "moderate", HND: "expensive", ICN: "moderate", BKK: "value", CNX: "value", DPS: "moderate", SIN: "expensive", HAN: "value", MLE: "resort", DXB: "expensive", CPT: "moderate", RAK: "moderate", NBO: "resort", CDG: "expensive", MRS: "expensive", NAP: "resort", FCO: "expensive", FLR: "expensive", JTR: "resort", LIS: "moderate", BCN: "expensive", KEF: "expensive", LHR: "expensive", JFK: "expensive", MEX: "value", TQO: "resort", SJO: "moderate", GIG: "moderate", EZE: "value", FTE: "expensive", YYC: "expensive", YVR: "moderate", OGG: "resort", SYD: "expensive", CHC: "expensive", PPT: "resort",
};
const typicalCostLevel = { affordable: "value", value: "value", moderate: "moderate", upscale: "expensive", expensive: "expensive", luxury: "very_expensive", resort: "very_expensive" };
const radiusByType = { city: 15, island: 60, region: 90, country: 250, route: 50, nature_area: 80, resort_area: 35, multi_stop: 80 };

export function enrichDestinationIntelligence(destination) {
  const destinationType = destinationTypeByName.get(destination.city) || "city";
  const sourceCostLevel = destination.costLevel || legacyCostLevels[destination.id || destination.airport] || null;
  const typical = typicalCostLevel[sourceCostLevel] || null;
  const aliases = [...new Set([...(destination.aliases || []), destination.city])];
  return {
    ...destination,
    canonicalName: destination.city,
    destinationType,
    aliases,
    primaryAirportCodes: [...new Set([destination.airport, destination.accessibilityProfile?.nearestAirport].filter(Boolean))],
    hotelSearchCenters: searchOverrides[destination.city] || [destination.city],
    hotelSearchAliases: aliases,
    nearbyHotelAreas: [],
    excludeHotelAreas: [],
    hotelSearchRadiusKm: radiusByType[destinationType],
    hotelNeighborhoodProfiles: [],
    typicalCostLevel: typical,
    supportsValue: typical !== "very_expensive",
    supportsMidrange: true,
    supportsPremium: true,
    costFlexibility: typical === "very_expensive" ? 35 : typical === "expensive" ? 65 : 80,
    costModelReviewStatus: "baseline_requires_editorial_review",
    productionReady: Boolean(destination.image && destination.airport && DESTINATION_TYPES.has(destinationType)),
  };
}

export { DESTINATION_TYPES };
