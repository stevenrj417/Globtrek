// GlobTrek launch set: the destinations held to the "perfect" standard (see
// scripts/check-launch.mjs). Everything here was verified by hand; each entry
// records when and where. Verified places override database inventory for
// these destinations, so a launch destination never shows an unverified hotel.

export const LAUNCH_SET = [
  "las-vegas-76868", "san-diego-76868", "los-angeles-76868", "palm-springs-76868", "san-francisco-76868",
  "seattle-76868", "honolulu-76868", "MEX", "oaxaca-city-41937", "guadalajara-41937", "puerto-vallarta-41937",
  "merida-41937", "LIS", "HAN", "BKK", "CNX", "EZE", "new-orleans-76868", "austin-76868", "chicago-76868",
];

// Dinners and activities: confirmed OPERATIONAL in Google Places on the verified date,
// with Google's rating and hours. Free activities keep their own page; paid ones go to
// Booking.com Attractions through CJ. Airport rides cite sources and flag uncertainty.
// Gallery photos: free Unsplash License, location confirmed on the photo page, checked by eye.
// Hotels: exact Booking.com property pages (opened and confirmed live), sent through
// GlobTrek's CJ link with dates and party size added. Guest scores are copied from
// the property page's own structured data, only where the page publishes one.
export const LAUNCH_DATA = {
  "las-vegas-76868": {
    verified: "2026-11-08",
    hotels: [
      { id: "lv-excalibur", name: "Excalibur", bookingUrl: "https://www.booking.com/hotel/us/excalibur.html", address: "3850 Las Vegas Boulevard South, Las Vegas, NV 89109", neighborhood: "South Strip", priceTier: "budget", rating: 7.6, reviewCount: 30544, ratingSource: "Booking.com", note: "Castle-themed Strip resort, walkable to Luxor and New York-New York" },
      { id: "lv-luxor", name: "Luxor", bookingUrl: "https://www.booking.com/hotel/us/luxor.html", address: "3900 Las Vegas Boulevard South, Las Vegas, NV 89119", neighborhood: "South Strip", priceTier: "budget", note: "Pyramid resort on the Strip, connected to Excalibur and Mandalay Bay" },
      { id: "lv-circus-circus", name: "Circus Circus Hotel, Casino & Theme Park", bookingUrl: "https://www.booking.com/hotel/us/circus-circus.html", address: "2880 Las Vegas Boulevard South, Las Vegas, NV 89109", neighborhood: "North Strip", priceTier: "budget", note: "Free parking and the indoor Adventuredome theme park" },
      { id: "lv-studio6-tropicana", name: "Studio 6 Suites Las Vegas, NV - Tropicana", bookingUrl: "https://www.booking.com/hotel/us/motel-6-las-vegas.html", address: "195 East Tropicana Avenue, Las Vegas, NV 89109", neighborhood: "Off-Strip, Tropicana", priceTier: "budget", note: "The former Motel 6 Tropicana; a short walk to Excalibur and Luxor" },
    ],
    gallery: [
      {
        "src": "https://images.unsplash.com/photo-1581351721010-8cf859cb14a4",
        "alt": "The Las Vegas Strip at night with the Bellagio fountains",
        "credit": "Julian Paefgen, Unsplash"
      },
      {
        "src": "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d",
        "alt": "The Welcome to Fabulous Las Vegas sign",
        "credit": "Grant Cai, Unsplash"
      },
      {
        "src": "https://images.unsplash.com/photo-1634400139456-292e44ca5327",
        "alt": "Paris Las Vegas on Las Vegas Boulevard at dusk",
        "credit": "Unsplash"
      },
      {
        "src": "https://images.unsplash.com/photo-1627776353501-3370031896ed",
        "alt": "A desert valley in Red Rock Canyon near Las Vegas",
        "credit": "Unsplash"
      }
    ],
    dinners: [
      {
        "name": "Tacos El Gordo",
        "address": "3041 S Las Vegas Blvd, Las Vegas, NV 89109, USA",
        "latitude": 36.132143,
        "longitude": -115.1645509,
        "rating": 4.3,
        "reviewCount": 17797,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJuZ22zmzEyIARH1U2pl31Nes",
        "googleMapsUri": "https://maps.google.com/?cid=16948722555248071967",
        "officialWebsiteUrl": "https://rebrand.ly/tacos-gordo",
        "hours": [
          "Monday: 10:00 AM – 2:00 AM",
          "Tuesday: 10:00 AM – 2:00 AM",
          "Wednesday: 10:00 AM – 2:00 AM",
          "Thursday: 10:00 AM – 2:00 AM",
          "Friday: 10:00 AM – 5:00 AM",
          "Saturday: 10:00 AM – 5:00 AM",
          "Sunday: 10:00 AM – 2:00 AM"
        ],
        "id": "lv-tacos-el-gordo",
        "priceLevel": 1,
        "order": "Tijuana-style tacos; order the adobada",
        "reservations": "walk-in",
        "reservable": false
      },
      {
        "name": "Secret Pizza",
        "address": "Boulevard Tower, 3708 Las Vegas Blvd S Level 3, Las Vegas, NV 89109, USA",
        "latitude": 36.109837,
        "longitude": -115.174212,
        "rating": 4.5,
        "reviewCount": 6047,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJH-R5EDHEyIARIcni5p0HcnA",
        "googleMapsUri": "https://maps.google.com/?cid=8102547054357825825",
        "officialWebsiteUrl": "https://www.cosmopolitanlasvegas.com/",
        "hours": [
          "Monday: 11:00 AM – 4:00 AM",
          "Tuesday: 11:00 AM – 4:00 AM",
          "Wednesday: 11:00 AM – 4:00 AM",
          "Thursday: 11:00 AM – 4:00 AM",
          "Friday: 11:00 AM – 4:00 AM",
          "Saturday: 11:00 AM – 4:00 AM",
          "Sunday: 11:00 AM – 4:00 AM"
        ],
        "id": "lv-secret-pizza",
        "priceLevel": 1,
        "order": "Unmarked pizza counter on the Cosmopolitan's third floor; slices",
        "reservations": "walk-in",
        "reservable": true
      },
      {
        "name": "In-N-Out Burger",
        "address": "3545 S Las Vegas Blvd Ste L24, Las Vegas, NV 89109, USA",
        "latitude": 36.1174161,
        "longitude": -115.16994469999997,
        "rating": 4.5,
        "reviewCount": 15520,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJoxirzyrFyIARHdJoX3i1NJg",
        "googleMapsUri": "https://maps.google.com/?cid=10967590521155408413",
        "officialWebsiteUrl": "https://locations.in-n-out.com/320",
        "hours": [
          "Monday: 10:30 AM – 1:00 AM",
          "Tuesday: 10:30 AM – 1:00 AM",
          "Wednesday: 10:30 AM – 1:00 AM",
          "Thursday: 10:30 AM – 1:00 AM",
          "Friday: 10:30 AM – 1:30 AM",
          "Saturday: 10:30 AM – 1:30 AM",
          "Sunday: 10:30 AM – 1:00 AM"
        ],
        "id": "lv-in-n-out-burger",
        "priceLevel": 1,
        "order": "Double-Double, animal style",
        "reservations": "walk-in",
        "reservable": false
      },
      {
        "name": "Phở Kim Long Restaurant",
        "address": "4023 W Spring Mountain Rd, Las Vegas, NV 89102, USA",
        "latitude": 36.1260811,
        "longitude": -115.1934816,
        "rating": 4,
        "reviewCount": 5756,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJ11OtYKbGyIARvOjkpIxr_6w",
        "googleMapsUri": "https://maps.google.com/?cid=12465800545390880956",
        "officialWebsiteUrl": "https://www.phokimlong.vegas/",
        "hours": [
          "Monday: 8:00 AM – 2:30 AM",
          "Tuesday: 8:00 AM – 2:30 AM",
          "Wednesday: 8:00 AM – 2:30 AM",
          "Thursday: 8:00 AM – 2:30 AM",
          "Friday: 8:00 AM – 4:30 AM",
          "Saturday: 8:00 AM – 4:30 AM",
          "Sunday: 8:00 AM – 4:30 AM"
        ],
        "id": "lv-ph-kim-long-restaurant",
        "priceLevel": 2,
        "order": "Big bowls of pho in Chinatown",
        "reservations": "walk-in",
        "reservable": false
      },
      {
        "name": "Ellis Island Barbecue",
        "address": "4178 Koval Ln, Las Vegas, NV 89109, USA",
        "latitude": 36.113055599999996,
        "longitude": -115.1633333,
        "rating": 4.5,
        "reviewCount": 1416,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJZ0ubSEjEyIAR0JnEtmNVcXA",
        "googleMapsUri": "https://maps.google.com/?cid=8102351091372693968",
        "officialWebsiteUrl": "https://www.ellisislandcasino.com/ellis-island-bbq",
        "hours": [
          "Monday: 4:00 – 10:00 PM",
          "Tuesday: 4:00 – 10:00 PM",
          "Wednesday: 4:00 – 10:00 PM",
          "Thursday: 4:00 – 10:00 PM",
          "Friday: 4:00 – 11:00 PM",
          "Saturday: 4:00 – 11:00 PM",
          "Sunday: 4:00 – 10:00 PM"
        ],
        "id": "lv-ellis-island-barbecue",
        "priceLevel": 2,
        "order": "Off-Strip barbecue and house beer",
        "reservations": "reservations",
        "reservable": true
      },
      {
        "name": "Lotus of Siam",
        "address": "620 E Flamingo Rd, Las Vegas, NV 89119, USA",
        "latitude": 36.1151541,
        "longitude": -115.14970629999999,
        "rating": 4.3,
        "reviewCount": 2749,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJI8BNPL_FyIAREvWBG4s5mlI",
        "googleMapsUri": "https://maps.google.com/?cid=5952133127148270866",
        "officialWebsiteUrl": "http://www.lotusofsiamlv.com/",
        "hours": [
          "Monday: 11:30 AM – 10:00 PM",
          "Tuesday: 11:30 AM – 10:00 PM",
          "Wednesday: 11:30 AM – 10:00 PM",
          "Thursday: 11:30 AM – 10:00 PM",
          "Friday: 11:30 AM – 10:00 PM",
          "Saturday: 11:30 AM – 10:00 PM",
          "Sunday: 11:30 AM – 10:00 PM"
        ],
        "id": "lv-lotus-of-siam",
        "priceLevel": 2,
        "order": "Northern Thai; the khao soi",
        "reservations": "reservations",
        "reservable": true
      }
    ],
    activities: [
      {
        "name": "Fountains of Bellagio",
        "address": "3600 S Las Vegas Blvd, Las Vegas, NV 89109, USA",
        "latitude": 36.112718699999995,
        "longitude": -115.17391090000001,
        "rating": 4.8,
        "reviewCount": 61631,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJswuaqjrEyIAR1vBx3GxKR-I",
        "googleMapsUri": "https://maps.google.com/?cid=16305082807333548246",
        "officialWebsiteUrl": "https://bellagio.mgmresorts.com/en/entertainment/fountains-of-bellagio.html",
        "hours": [
          "Monday: Open 24 hours",
          "Tuesday: Open 24 hours",
          "Wednesday: Open 24 hours",
          "Thursday: Open 24 hours",
          "Friday: Open 24 hours",
          "Saturday: Open 24 hours",
          "Sunday: Open 24 hours"
        ],
        "id": "lv-fountains-of-bellagio",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 15,
        "category": "show",
        "description": "Free water and music show every 15–30 minutes"
      },
      {
        "name": "Bellagio Conservatory & Botanical Gardens",
        "address": "Bellagio Hotel & Casino, 3600 S Las Vegas Blvd, Las Vegas, NV 89109, USA",
        "latitude": 36.1119912,
        "longitude": -115.1765648,
        "rating": 4.8,
        "reviewCount": 42174,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJSYKEyTrEyIARJZPSoDxr_MY",
        "googleMapsUri": "https://maps.google.com/?cid=14338453221781181221",
        "officialWebsiteUrl": "https://www.bellagio.com/en/entertainment/conservatory-botanical-garden.html?ecid=GMB",
        "hours": [
          "Monday: Open 24 hours",
          "Tuesday: Open 24 hours",
          "Wednesday: Open 24 hours",
          "Thursday: Open 24 hours",
          "Friday: Open 24 hours",
          "Saturday: Open 24 hours",
          "Sunday: Open 24 hours"
        ],
        "id": "lv-bellagio-conservatory-botanical-gardens",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 30,
        "category": "garden",
        "description": "Free seasonal garden displays inside the Bellagio"
      },
      {
        "name": "Fremont Street Experience",
        "address": "Fremont St, Las Vegas, NV 89101, USA",
        "latitude": 36.1707275,
        "longitude": -115.14382289999999,
        "rating": 4.6,
        "reviewCount": 149169,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJe64G4Z_DyIARNFDM0lNK7xk",
        "googleMapsUri": "https://maps.google.com/?cid=1868794094261391412",
        "officialWebsiteUrl": "https://vegasexperience.com/?utm_source=google&utm_medium=organic&utm_campaign=GMB",
        "hours": [
          "Monday: Open 24 hours",
          "Tuesday: Open 24 hours",
          "Wednesday: Open 24 hours",
          "Thursday: Open 24 hours",
          "Friday: Open 24 hours",
          "Saturday: Open 24 hours",
          "Sunday: Open 24 hours"
        ],
        "id": "lv-fremont-street-experience",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 90,
        "category": "nightlife",
        "description": "Free LED canopy light shows and street performers downtown"
      },
      {
        "name": "Flamingo Wildlife Habitat",
        "address": "3555 S Las Vegas Blvd, Las Vegas, NV 89109, USA",
        "latitude": 36.1164027,
        "longitude": -115.17103129999998,
        "rating": 4.5,
        "reviewCount": 4794,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJQwXiyDvEyIARx-emM17XEB8",
        "googleMapsUri": "https://maps.google.com/?cid=2238525814396610503",
        "officialWebsiteUrl": "https://www.caesars.com/flamingo-las-vegas/things-to-do/wildlife-habitat?utm_campaign=GMB&utm_source=google&utm_medium=local&utm_term=Wildlife%20Habitat&utm_content=attractions",
        "hours": [
          "Monday: 7:00 AM – 8:00 PM",
          "Tuesday: 7:00 AM – 8:00 PM",
          "Wednesday: 7:00 AM – 8:00 PM",
          "Thursday: 7:00 AM – 8:00 PM",
          "Friday: 7:00 AM – 8:00 PM",
          "Saturday: 7:00 AM – 8:00 PM",
          "Sunday: 7:00 AM – 8:00 PM"
        ],
        "id": "lv-flamingo-wildlife-habitat",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 30,
        "category": "nature",
        "description": "Free flamingos, pelicans and koi behind the Flamingo"
      },
      {
        "name": "High Roller",
        "address": "3545 S Las Vegas Blvd, Las Vegas, NV 89109, USA",
        "latitude": 36.1176309,
        "longitude": -115.1682936,
        "rating": 4.6,
        "reviewCount": 32385,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJuwTmHznEyIARt0z2kIFS-S4",
        "googleMapsUri": "https://maps.google.com/?cid=3384827311381957815",
        "officialWebsiteUrl": "https://www.caesars.com/linq/things-to-do/attractions/high-roller?utm_campaign=google&utm_source=google&utm_medium=local&utm_term=HighRoller&utm_content=attractions&y_source=1_NDM2Njg1NS03MTUtbG9jYXRpb24ud2Vic2l0ZQ==",
        "hours": [
          "Monday: 12:30 – 11:30 PM",
          "Tuesday: 12:30 – 11:30 PM",
          "Wednesday: 12:30 – 11:30 PM",
          "Thursday: 12:30 – 11:30 PM",
          "Friday: 12:30 PM – 1:30 AM",
          "Saturday: 12:30 PM – 1:30 AM",
          "Sunday: 12:30 PM – 1:30 AM"
        ],
        "id": "lv-high-roller",
        "estimatedCostLow": 25,
        "estimatedCostHigh": 45,
        "isFree": false,
        "durationMinutes": 30,
        "category": "views",
        "description": "550-foot observation wheel at the LINQ"
      },
      {
        "name": "The Mob Museum",
        "address": "300 Stewart Ave, Las Vegas, NV 89101, USA",
        "latitude": 36.1728198,
        "longitude": -115.1412395,
        "rating": 4.7,
        "reviewCount": 20397,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJ6dSwgwrDyIARnTLnwBzbNVU",
        "googleMapsUri": "https://maps.google.com/?cid=6140054583531483805",
        "officialWebsiteUrl": "https://themobmuseum.org/",
        "hours": [
          "Monday: 9:00 AM – 9:00 PM",
          "Tuesday: 9:00 AM – 9:00 PM",
          "Wednesday: 9:00 AM – 9:00 PM",
          "Thursday: 9:00 AM – 9:00 PM",
          "Friday: 9:00 AM – 9:00 PM",
          "Saturday: 9:00 AM – 9:00 PM",
          "Sunday: 9:00 AM – 9:00 PM"
        ],
        "id": "lv-the-mob-museum",
        "estimatedCostLow": 30,
        "estimatedCostHigh": 45,
        "isFree": false,
        "durationMinutes": 120,
        "category": "museum",
        "description": "National Museum of Organized Crime and Law Enforcement"
      }
    ],
    airportRide: {
      "airport": "Harry Reid International Airport (LAS)",
      "airportLatitude": 36.08309070000001,
      "airportLongitude": -115.1482238,
      "transit": {
        "summary": "RTC buses run from the airport to the Strip",
        "fare": "About $6 for a 2-hour pass or $8 for 24 hours",
        "checkUrl": "https://www.rtcsnv.com/",
        "note": "RTC proposed fare changes and changed routes in 2026; check current fares and routes before you go"
      },
      "rideshare": {
        "summary": "Uber and Lyft pick up at the terminal parking garages",
        "fare": "About $12–25 to the Strip off-peak",
        "provider": "Uber"
      },
      "miles": 5,
      "sources": [
        "https://lasvegaswonders.com/?p=7447",
        "https://www.nomadotravel.app/en/guides/getting-around-las-vegas"
      ]
    },
  },
};

export function launchHotels(destinationId) {
  return (LAUNCH_DATA[destinationId]?.hotels || []).map((hotel) => ({
    ...hotel,
    type: "hotel",
    provider: "booking.com",
    providerUrl: hotel.bookingUrl,
    providerLinkVerified: true,
    verifiedAt: LAUNCH_DATA[destinationId].verified,
    verificationSource: hotel.bookingUrl,
    amenities: [],
    tags: [],
  }));
}

export function launchDinners(destinationId) {
  return (LAUNCH_DATA[destinationId]?.dinners || []).map((item) => ({ ...item, type: "restaurant", provider: "google_places", verifiedAt: LAUNCH_DATA[destinationId].verified }));
}

export function launchActivities(destinationId) {
  return (LAUNCH_DATA[destinationId]?.activities || []).map((item) => ({ ...item, type: "activity", provider: item.isFree ? "official" : "booking.com_attractions", verifiedAt: LAUNCH_DATA[destinationId].verified }));
}

// One-tap rideshare from the airport to a hotel (Uber universal link; no partnership needed).
export function rideshareUrl(ride, hotel) {
  if (!ride?.airportLatitude || !hotel?.address) return null;
  const params = new URLSearchParams({
    action: "setPickup",
    "pickup[latitude]": String(ride.airportLatitude),
    "pickup[longitude]": String(ride.airportLongitude),
    "pickup[nickname]": ride.airport,
    "dropoff[formatted_address]": hotel.address,
    "dropoff[nickname]": hotel.name,
  });
  return `https://m.uber.com/ul/?${params.toString()}`;
}
