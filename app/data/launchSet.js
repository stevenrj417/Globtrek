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
        "checkLabel": "Check RTC",
        "note": "RTC proposed fare changes and changed routes in 2026; check current fares and routes before you go"
      },
      "rideshare": {
        "summary": "Uber and Lyft pick up at the terminal parking garages",
        "fare": "About $12–25 to the Strip off-peak",
        "provider": "Uber"
      },
      "miles": 5,
      "toCenterLabel": "the Strip",
      "sources": [
        "https://lasvegaswonders.com/?p=7447",
        "https://www.nomadotravel.app/en/guides/getting-around-las-vegas"
      ]
    },
  },
  "san-diego-76868": {
    "verified": "2026-11-08",
    "hotels": [
      {
        "id": "sd-hi-downtown",
        "name": "HI San Diego Downtown Hostel",
        "bookingUrl": "https://www.booking.com/hotel/us/hostelling-international-san-diego.html",
        "address": "521 Market Street, San Diego, CA 92101",
        "neighborhood": "Gaslamp Quarter",
        "priceTier": "budget",
        "rating": 8.6,
        "reviewCount": 1548,
        "ratingSource": "Booking.com",
        "note": "Nonprofit hostel with private rooms and a shared kitchen, a short walk from the bus to the airport"
      },
      {
        "id": "sd-samesun-ob",
        "name": "Samesun Ocean Beach Hotel & Hostel",
        "bookingUrl": "https://www.booking.com/hotel/us/samesun-ocean-beach.html",
        "address": "4961 Newport Avenue, San Diego, CA 92107",
        "neighborhood": "Ocean Beach",
        "priceTier": "budget",
        "note": "On Ocean Beach's main street, steps from the sand and Hodad's"
      },
      {
        "id": "sd-days-inn-hotel-circle",
        "name": "Days Inn by Wyndham San Diego Hotel Circle",
        "bookingUrl": "https://www.booking.com/hotel/us/days-circle.html",
        "address": "543 Hotel Circle South, San Diego, CA 92108",
        "neighborhood": "Mission Valley",
        "priceTier": "budget",
        "rating": 7.8,
        "reviewCount": 4087,
        "ratingSource": "Booking.com",
        "note": "Private rooms off Interstate 8, central for driving to beaches and Old Town"
      },
      {
        "id": "sd-kings-inn",
        "name": "Kings Inn",
        "bookingUrl": "https://www.booking.com/hotel/us/kings-inn.html",
        "address": "1333 Hotel Circle South, San Diego, CA 92108",
        "neighborhood": "Mission Valley",
        "priceTier": "budget",
        "note": "Budget motel in Hotel Circle, near Old Town"
      }
    ],
    "gallery": [
      {
        "src": "https://images.unsplash.com/photo-1514939775307-d44e7f10cabd",
        "alt": "The downtown San Diego skyline at night across the bay",
        "credit": "Lucas Davies, Unsplash"
      },
      {
        "src": "https://images.unsplash.com/photo-1546200378-434d318e5715",
        "alt": "Waves breaking along the La Jolla coastline",
        "credit": "Zach Josephson, Unsplash"
      },
      {
        "src": "https://images.unsplash.com/photo-1612301738481-cb439dcf3c05",
        "alt": "The lily pond and palms in Balboa Park",
        "credit": "Zane Persaud, Unsplash"
      },
      {
        "src": "https://images.unsplash.com/photo-1611459710407-40e34c81b19c",
        "alt": "Sunset through Crystal Pier in Pacific Beach",
        "credit": "Unsplash"
      }
    ],
    "dinners": [
      {
        "name": "Las Cuatro Milpas",
        "address": "1985 National Ave Ste 1131, San Diego, CA 92113, USA",
        "latitude": 32.6996341,
        "longitude": -117.1451038,
        "rating": 4.6,
        "reviewCount": 4555,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJ_2H_8mtT2YAR-NwWFrZW6LA",
        "googleMapsUri": "https://maps.google.com/?cid=12747534085326822648",
        "officialWebsiteUrl": "http://lascuatromilpas.online/",
        "hours": [
          "Monday: 8:00 AM – 3:00 PM",
          "Tuesday: 8:00 AM – 3:00 PM",
          "Wednesday: 8:00 AM – 3:00 PM",
          "Thursday: 8:00 AM – 3:00 PM",
          "Friday: 8:00 AM – 3:00 PM",
          "Saturday: 7:00 AM – 3:00 PM",
          "Sunday: Closed"
        ],
        "id": "sd-las-cuatro-milpas",
        "priceLevel": 1,
        "order": "Barrio Logan institution; handmade tortillas and rolled tacos",
        "reservations": "walk-in",
        "reservable": false
      },
      {
        "name": "Hodad's Ocean Beach",
        "address": "5010 Newport Ave, San Diego, CA 92107, USA",
        "latitude": 32.7472099,
        "longitude": -117.25114620000001,
        "rating": 4.6,
        "reviewCount": 6254,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJaYaXFTqq3oARNy537Kb_W_c",
        "googleMapsUri": "https://maps.google.com/?cid=17824121042645757495",
        "officialWebsiteUrl": "http://hodadsoceanbeach.com/",
        "hours": [
          "Monday: 11:00 AM – 9:00 PM",
          "Tuesday: 11:00 AM – 9:00 PM",
          "Wednesday: 11:00 AM – 9:00 PM",
          "Thursday: 11:00 AM – 9:00 PM",
          "Friday: 11:00 AM – 9:00 PM",
          "Saturday: 11:00 AM – 9:00 PM",
          "Sunday: 11:00 AM – 9:00 PM"
        ],
        "id": "sd-hodad-s-ocean-beach",
        "priceLevel": 2,
        "order": "Ocean Beach burgers; the bacon cheeseburger",
        "reservations": "walk-in",
        "reservable": false
      },
      {
        "name": "Lucha Libre Taco Shop",
        "address": "1810 W Washington St, San Diego, CA 92103, USA",
        "latitude": 32.7433427,
        "longitude": -117.18162960000001,
        "rating": 4.3,
        "reviewCount": 4353,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJq8oURS6r3oARdtYfAS-k538",
        "googleMapsUri": "https://maps.google.com/?cid=9216515684226291318",
        "officialWebsiteUrl": "http://www.luchalibretacoshop.com/",
        "hours": [
          "Monday: 10:00 AM – 10:00 PM",
          "Tuesday: 10:00 AM – 10:00 PM",
          "Wednesday: 10:00 AM – 10:00 PM",
          "Thursday: 10:00 AM – 10:00 PM",
          "Friday: 10:00 AM – 11:00 PM",
          "Saturday: 10:00 AM – 11:00 PM",
          "Sunday: 10:00 AM – 10:00 PM"
        ],
        "id": "sd-lucha-libre-taco-shop",
        "priceLevel": 1,
        "order": "Wrestling-themed taco shop; the surfin' California burrito",
        "reservations": "walk-in",
        "reservable": false
      },
      {
        "name": "Phil's BBQ",
        "address": "3750 Sports Arena Blvd, San Diego, CA 92110, USA",
        "latitude": 32.7548759,
        "longitude": -117.2158625,
        "rating": 4.6,
        "reviewCount": 12407,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJ7THPXPeq3oARSc2LId_Icwg",
        "googleMapsUri": "https://maps.google.com/?cid=609051235291221321",
        "officialWebsiteUrl": "http://www.philsbbq.com/",
        "hours": [
          "Monday: 11:00 AM – 10:00 PM",
          "Tuesday: 11:00 AM – 10:00 PM",
          "Wednesday: 11:00 AM – 10:00 PM",
          "Thursday: 11:00 AM – 10:00 PM",
          "Friday: 11:00 AM – 10:00 PM",
          "Saturday: 11:00 AM – 10:00 PM",
          "Sunday: 11:00 AM – 10:00 PM"
        ],
        "id": "sd-phil-s-bbq",
        "priceLevel": 2,
        "order": "Ribs and barbecue sandwiches",
        "reservations": "walk-in",
        "reservable": false
      },
      {
        "name": "Liberty Public Market",
        "address": "2820 Historic Decatur Rd, San Diego, CA 92106, USA",
        "latitude": 32.7400774,
        "longitude": -117.2110573,
        "rating": 4.7,
        "reviewCount": 8297,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJqTNLdAOr3oARx08fgT_mxGg",
        "googleMapsUri": "https://maps.google.com/?cid=7549412035803434951",
        "officialWebsiteUrl": "https://libertypublicmarketsd.com/",
        "hours": [
          "Monday: 9:00 AM – 8:00 PM",
          "Tuesday: 9:00 AM – 8:00 PM",
          "Wednesday: 9:00 AM – 8:00 PM",
          "Thursday: 9:00 AM – 8:00 PM",
          "Friday: 9:00 AM – 8:00 PM",
          "Saturday: 9:00 AM – 8:00 PM",
          "Sunday: 9:00 AM – 8:00 PM"
        ],
        "id": "sd-liberty-public-market",
        "priceLevel": null,
        "order": "Food hall in Liberty Station; something for everyone",
        "reservations": "walk-in",
        "reservable": false
      },
      {
        "name": "The Taco Stand",
        "address": "621 Pearl St, La Jolla, CA 92037, USA",
        "latitude": 32.839351799999996,
        "longitude": -117.2768191,
        "rating": 4.6,
        "reviewCount": 6669,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJ64xh0eUD3IARg7gW9skpNQc",
        "googleMapsUri": "https://maps.google.com/?cid=519367279425009795",
        "officialWebsiteUrl": "http://www.letstaco.com/",
        "hours": [
          "Monday: 9:00 AM – 9:00 PM",
          "Tuesday: 9:00 AM – 9:00 PM",
          "Wednesday: 9:00 AM – 9:00 PM",
          "Thursday: 9:00 AM – 9:00 PM",
          "Friday: 9:00 AM – 10:00 PM",
          "Saturday: 9:00 AM – 10:00 PM",
          "Sunday: 9:00 AM – 9:00 PM"
        ],
        "id": "sd-the-taco-stand",
        "priceLevel": 1,
        "order": "Baja-style tacos; the al pastor",
        "reservations": "walk-in",
        "reservable": false
      }
    ],
    "activities": [
      {
        "name": "Balboa Park",
        "address": "San Diego, CA, USA",
        "latitude": 32.734147899999996,
        "longitude": -117.14455299999997,
        "rating": 4.8,
        "reviewCount": 79729,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJA8tw-pZU2YARxPYVsDwL8-0",
        "googleMapsUri": "https://maps.google.com/?cid=17146060561609782980",
        "officialWebsiteUrl": "https://balboapark.org/",
        "hours": [
          "Monday: Open 24 hours",
          "Tuesday: Open 24 hours",
          "Wednesday: Open 24 hours",
          "Thursday: Open 24 hours",
          "Friday: Open 24 hours",
          "Saturday: Open 24 hours",
          "Sunday: Open 24 hours"
        ],
        "id": "sd-balboa-park",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 180,
        "category": "park",
        "description": "Gardens, Spanish-style architecture and walking paths; museums inside charge separately"
      },
      {
        "name": "La Jolla Cove",
        "address": "La Jolla Cove, San Diego, CA 92037, USA",
        "latitude": 32.8503895,
        "longitude": -117.27294350000001,
        "rating": 4.8,
        "reviewCount": 5325,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJ6-V2qP4D3IARF8anKDxl_5A",
        "googleMapsUri": "https://maps.google.com/?cid=10448180969577367063",
        "officialWebsiteUrl": null,
        "hours": [],
        "id": "sd-la-jolla-cove",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 60,
        "category": "nature",
        "description": "Sea lions and seals on the rocks, tide pools at low tide"
      },
      {
        "name": "Sunset Cliffs Natural Park",
        "address": "Ladera St, San Diego, CA 92107, USA",
        "latitude": 32.715915,
        "longitude": -117.25516789999999,
        "rating": 4.8,
        "reviewCount": 9018,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJA65lSMOr3oARFZHgtdTySeo",
        "googleMapsUri": "https://maps.google.com/?cid=16882291673573396757",
        "officialWebsiteUrl": "https://www.sandiego.gov/park-and-recreation/parks/regional/shoreline/sunset",
        "hours": [
          "Monday: Open 24 hours",
          "Tuesday: Open 24 hours",
          "Wednesday: Open 24 hours",
          "Thursday: Open 24 hours",
          "Friday: Open 24 hours",
          "Saturday: Open 24 hours",
          "Sunday: Open 24 hours"
        ],
        "id": "sd-sunset-cliffs-natural-park",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 60,
        "category": "nature",
        "description": "Clifftop walk for sunset over the Pacific"
      },
      {
        "name": "Old Town San Diego State Historic Park",
        "address": "San Diego Avenue and, Twiggs St, San Diego, CA 92110, USA",
        "latitude": 32.7549063,
        "longitude": -117.19764070000001,
        "rating": 4.7,
        "reviewCount": 31990,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJe9OrW-eq3oARuXXd8wQMg14",
        "googleMapsUri": "https://maps.google.com/?cid=6810300276925101497",
        "officialWebsiteUrl": "https://www.parks.ca.gov/?page_id=663",
        "hours": [
          "Monday: 10:00 AM – 5:00 PM",
          "Tuesday: 10:00 AM – 5:00 PM",
          "Wednesday: 10:00 AM – 5:00 PM",
          "Thursday: 10:00 AM – 5:00 PM",
          "Friday: 10:00 AM – 5:00 PM",
          "Saturday: 10:00 AM – 5:00 PM",
          "Sunday: 10:00 AM – 5:00 PM"
        ],
        "id": "sd-old-town-san-diego-state-historic-park",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 90,
        "category": "history",
        "description": "Free historic park with small museums and adobe buildings"
      },
      {
        "name": "USS Midway Museum",
        "address": "910 N Harbor Dr, San Diego, CA 92101, USA",
        "latitude": 32.7137398,
        "longitude": -117.17512649999999,
        "rating": 4.8,
        "reviewCount": 53304,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJwYBuKqtU2YARslNFQDCJt_s",
        "googleMapsUri": "https://maps.google.com/?cid=18138116864587682738",
        "officialWebsiteUrl": "https://www.midway.org/",
        "hours": [
          "Monday: 10:00 AM – 5:00 PM",
          "Tuesday: 10:00 AM – 5:00 PM",
          "Wednesday: 10:00 AM – 5:00 PM",
          "Thursday: 10:00 AM – 5:00 PM",
          "Friday: 10:00 AM – 5:00 PM",
          "Saturday: 10:00 AM – 5:00 PM",
          "Sunday: 10:00 AM – 5:00 PM"
        ],
        "id": "sd-uss-midway-museum",
        "estimatedCostLow": 30,
        "estimatedCostHigh": 40,
        "isFree": false,
        "durationMinutes": 180,
        "category": "museum",
        "description": "Aircraft carrier museum on the bay"
      },
      {
        "name": "San Diego Zoo",
        "address": "2920 Zoo Dr, San Diego, CA 92101, USA",
        "latitude": 32.7360353,
        "longitude": -117.1509849,
        "rating": 4.7,
        "reviewCount": 67712,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJyYB_SZVU2YARR-I1Jjf08F0",
        "googleMapsUri": "https://maps.google.com/?cid=6769178757639299655",
        "officialWebsiteUrl": "https://zoo.sandiegozoo.org/",
        "hours": [
          "Monday: 9:00 AM – 5:00 PM",
          "Tuesday: 9:00 AM – 5:00 PM",
          "Wednesday: 9:00 AM – 5:00 PM",
          "Thursday: 9:00 AM – 5:00 PM",
          "Friday: 9:00 AM – 5:00 PM",
          "Saturday: 9:00 AM – 5:00 PM",
          "Sunday: 9:00 AM – 5:00 PM"
        ],
        "id": "sd-san-diego-zoo",
        "estimatedCostLow": 70,
        "estimatedCostHigh": 85,
        "isFree": false,
        "durationMinutes": 300,
        "category": "zoo",
        "description": "The city's famous zoo in Balboa Park"
      }
    ],
    "airportRide": {
      "airport": "San Diego International Airport (SAN)",
      "airportLatitude": 32.7328909,
      "airportLongitude": -117.1897127,
      "toCenterLabel": "downtown",
      "transit": {
        "summary": "MTS Route 992 runs directly from both terminals to downtown, across from Santa Fe Depot",
        "fare": "About $2.50 one way, or a $6 day pass earned by tapping a card or the PRONTO app",
        "checkUrl": "https://www.sdmts.com/getting-around/airport",
        "checkLabel": "Check MTS",
        "note": "Fares come from an older MTS fare sheet; check current fares before you go"
      },
      "rideshare": {
        "summary": "Uber and Lyft run from the terminals",
        "fare": "About $10–20 to downtown, 10–15 minutes; expect surges during big events",
        "provider": "Uber"
      },
      "miles": 3,
      "sources": [
        "https://www.sdmts.com/getting-around/airport",
        "https://www.sdmts.com/sites/default/files/routes/pdfnext/992.pdf",
        "https://leveled-mgmt.pages.dev/san-diego/guests/downtown/getting-around"
      ]
    }
  },
  "los-angeles-76868": {
    "verified": "2026-11-08",
    "hotels": [
      {
        "id": "la-hi-santa-monica",
        "name": "HI Los Angeles Santa Monica Hostel",
        "bookingUrl": "https://www.booking.com/hotel/us/hostelling-international.html",
        "address": "1436 2nd Street, Santa Monica, CA 90401",
        "neighborhood": "Santa Monica",
        "priceTier": "budget",
        "rating": 8.8,
        "reviewCount": 4730,
        "ratingSource": "Booking.com",
        "note": "Two blocks from the pier and the beach, with private rooms and a kitchen"
      },
      {
        "id": "la-samesun-venice",
        "name": "Samesun Venice Beach Hotel & Hostel",
        "bookingUrl": "https://www.booking.com/hotel/us/venice-beach-cotel-los-angeles.html",
        "address": "25 Windward Avenue, Los Angeles, CA 90291",
        "neighborhood": "Venice Beach",
        "priceTier": "budget",
        "note": "Right on the Venice boardwalk"
      },
      {
        "id": "la-samesun-hollywood",
        "name": "Samesun Hollywood Hotel & Hostel",
        "bookingUrl": "https://www.booking.com/hotel/us/samesun-hollywood.html",
        "address": "6820 Hollywood Boulevard, Los Angeles, CA 90028",
        "neighborhood": "Hollywood",
        "priceTier": "budget",
        "note": "On Hollywood Boulevard, on the Walk of Fame and near the Metro B Line"
      },
      {
        "id": "la-super8-culver-city",
        "name": "Super 8 by Wyndham Los Angeles-Culver City Area",
        "bookingUrl": "https://www.booking.com/hotel/us/super-8-culver-city.html",
        "address": "12664 West Washington Boulevard, Los Angeles, CA 90066",
        "neighborhood": "Mar Vista, near Culver City",
        "priceTier": "budget",
        "rating": 8.5,
        "reviewCount": 1029,
        "ratingSource": "Booking.com",
        "note": "Private motel rooms between LAX and the beaches"
      }
    ],
    "gallery": [
      {
        "src": "https://images.unsplash.com/photo-1572975165711-e9636eba67fc",
        "alt": "Griffith Observatory above Los Angeles at dusk",
        "credit": "Unsplash"
      },
      {
        "src": "https://images.unsplash.com/photo-1574562514932-a0fb04d5d347",
        "alt": "Santa Monica Pier and the beach at golden hour",
        "credit": "Unsplash"
      },
      {
        "src": "https://images.unsplash.com/photo-1609924211018-5526c55bad5b",
        "alt": "The Hollywood Sign on the hills",
        "credit": "Gabe, Unsplash"
      },
      {
        "src": "https://images.unsplash.com/photo-1523430410476-0185cb1f6ff9",
        "alt": "The entrance sign of Santa Monica Pier under palm trees",
        "credit": "Unsplash"
      }
    ],
    "dinners": [
      {
        "name": "Grand Central Market",
        "address": "317 S Broadway, Los Angeles, CA 90013, USA",
        "latitude": 34.050872,
        "longitude": -118.2490552,
        "rating": 4.5,
        "reviewCount": 37073,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJ53JDjkvGwoAR2NMG6_1OnUg",
        "googleMapsUri": "https://maps.google.com/?cid=5232425194551170008",
        "officialWebsiteUrl": "https://grandcentralmarket.com/",
        "hours": [
          "Monday: 8:00 AM – 9:00 PM",
          "Tuesday: 8:00 AM – 9:00 PM",
          "Wednesday: 8:00 AM – 9:00 PM",
          "Thursday: 8:00 AM – 9:00 PM",
          "Friday: 8:00 AM – 9:00 PM",
          "Saturday: 8:00 AM – 9:00 PM",
          "Sunday: 8:00 AM – 9:00 PM"
        ],
        "id": "la-grand-central-market",
        "priceLevel": null,
        "order": "Downtown food hall open since 1917; dozens of stalls",
        "reservations": "walk-in",
        "reservable": false
      },
      {
        "name": "Guisados",
        "address": "2100 E Cesar E Chavez Ave, Los Angeles, CA 90033, USA",
        "latitude": 34.0482592,
        "longitude": -118.21146770000001,
        "rating": 4.5,
        "reviewCount": 1770,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJJa92LAnGwoARwH4CYPv5T6k",
        "googleMapsUri": "https://maps.google.com/?cid=12200244773612846784",
        "officialWebsiteUrl": "http://www.guisados.la/",
        "hours": [
          "Monday: 9:00 AM – 9:00 PM",
          "Tuesday: 9:00 AM – 9:00 PM",
          "Wednesday: 9:00 AM – 9:00 PM",
          "Thursday: 9:00 AM – 9:00 PM",
          "Friday: 9:00 AM – 9:00 PM",
          "Saturday: 9:00 AM – 9:00 PM",
          "Sunday: 9:00 AM – 9:00 PM"
        ],
        "id": "la-guisados",
        "priceLevel": 1,
        "order": "Braised-meat tacos on handmade tortillas; get the sampler",
        "reservations": "walk-in",
        "reservable": false
      },
      {
        "name": "Leo's Tacos Truck",
        "address": "1515 S La Brea Ave, Los Angeles, CA 90019, USA",
        "latitude": 34.046205,
        "longitude": -118.3457754,
        "rating": 4.5,
        "reviewCount": 5907,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJvyR2GP64woARi52Ja30IGjc",
        "googleMapsUri": "https://maps.google.com/?cid=3970495356248628619",
        "officialWebsiteUrl": "http://leostacostruck.com/",
        "hours": [
          "Monday: 10:00 AM – 2:00 AM",
          "Tuesday: 10:00 AM – 2:00 AM",
          "Wednesday: 10:00 AM – 2:00 AM",
          "Thursday: 10:00 AM – 2:00 AM",
          "Friday: 10:00 AM – 3:30 AM",
          "Saturday: 10:00 AM – 3:30 AM",
          "Sunday: 10:00 AM – 2:00 AM"
        ],
        "id": "la-leo-s-tacos-truck",
        "priceLevel": 1,
        "order": "Al pastor carved straight off the spit",
        "reservations": "walk-in",
        "reservable": false
      },
      {
        "name": "Philippe The Original",
        "address": "1001 N Alameda St, Los Angeles, CA 90012, USA",
        "latitude": 34.059686299999996,
        "longitude": -118.23704889999999,
        "rating": 4.6,
        "reviewCount": 12335,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJd9NcMVvGwoARpVcjtJfZBQo",
        "googleMapsUri": "https://maps.google.com/?cid=722222560848336805",
        "officialWebsiteUrl": "https://www.philippes.com/",
        "hours": [
          "Monday: 6:00 AM – 10:00 PM",
          "Tuesday: 6:00 AM – 10:00 PM",
          "Wednesday: 6:00 AM – 10:00 PM",
          "Thursday: 6:00 AM – 10:00 PM",
          "Friday: 6:00 AM – 10:00 PM",
          "Saturday: 6:00 AM – 10:00 PM",
          "Sunday: 6:00 AM – 10:00 PM"
        ],
        "id": "la-philippe-the-original",
        "priceLevel": 1,
        "order": "French dip sandwiches near Union Station",
        "reservations": "walk-in",
        "reservable": false
      },
      {
        "name": "Pink's Hot Dogs",
        "address": "709 N La Brea Ave, Los Angeles, CA 90038, USA",
        "latitude": 34.0838505,
        "longitude": -118.3442797,
        "rating": 4.5,
        "reviewCount": 14044,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJVwjfzCq_woAR4FjKokeruig",
        "googleMapsUri": "https://maps.google.com/?cid=2934846431347497184",
        "officialWebsiteUrl": "http://www.pinkshollywood.com/",
        "hours": [
          "Monday: 9:30 AM – 12:00 AM",
          "Tuesday: 9:30 AM – 12:00 AM",
          "Wednesday: 9:30 AM – 12:00 AM",
          "Thursday: 9:30 AM – 12:00 AM",
          "Friday: 9:30 AM – 2:00 AM",
          "Saturday: 9:30 AM – 2:00 AM",
          "Sunday: 9:30 AM – 12:00 AM"
        ],
        "id": "la-pink-s-hot-dogs",
        "priceLevel": 1,
        "order": "Hollywood hot dog stand",
        "reservations": "walk-in",
        "reservable": false
      },
      {
        "name": "Langer's Delicatessen-Restaurant",
        "address": "704 S Alvarado St, Los Angeles, CA 90057, USA",
        "latitude": 34.0561783,
        "longitude": -118.27679930000001,
        "rating": 4.6,
        "reviewCount": 3840,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJP1rAZZ_HwoARAcX96y-BrjY",
        "googleMapsUri": "https://maps.google.com/?cid=3940228766818485505",
        "officialWebsiteUrl": "https://www.langersdeli.com/",
        "hours": [
          "Monday: 8:00 AM – 4:00 PM",
          "Tuesday: 8:00 AM – 4:00 PM",
          "Wednesday: 8:00 AM – 4:00 PM",
          "Thursday: 8:00 AM – 4:00 PM",
          "Friday: 8:00 AM – 4:00 PM",
          "Saturday: 8:00 AM – 4:00 PM",
          "Sunday: Closed"
        ],
        "id": "la-langer-s-delicatessen-restaurant",
        "priceLevel": 2,
        "order": "Hot pastrami; the #19",
        "reservations": "walk-in",
        "reservable": false
      }
    ],
    "activities": [
      {
        "name": "Griffith Observatory",
        "address": "2800 E Observatory Rd, Los Angeles, CA 90027, USA",
        "latitude": 34.1184341,
        "longitude": -118.30039350000001,
        "rating": 4.7,
        "reviewCount": 20702,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJywjU6WG_woAR3NrWwrEH_3M",
        "googleMapsUri": "https://maps.google.com/?cid=8358407893482396380",
        "officialWebsiteUrl": "https://griffithobservatory.org/",
        "hours": [
          "Monday: Closed",
          "Tuesday: 12:00 – 10:00 PM",
          "Wednesday: 12:00 – 10:00 PM",
          "Thursday: 12:00 – 10:00 PM",
          "Friday: 12:00 – 10:00 PM",
          "Saturday: 10:00 AM – 10:00 PM",
          "Sunday: 10:00 AM – 10:00 PM"
        ],
        "id": "la-griffith-observatory",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 120,
        "category": "views",
        "description": "Free admission, with city and Hollywood Sign views; planetarium shows cost extra"
      },
      {
        "name": "The Getty",
        "address": "1200 Getty Center Dr, Los Angeles, CA 90049, USA",
        "latitude": 34.0773438,
        "longitude": -118.4732648,
        "rating": 4.8,
        "reviewCount": 37735,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJbzYnQte8woARJaqqFVpKeNo",
        "googleMapsUri": "https://maps.google.com/?cid=15742414248244587045",
        "officialWebsiteUrl": "https://www.getty.edu/",
        "hours": [
          "Monday: Closed",
          "Tuesday: 10:00 AM – 6:30 PM",
          "Wednesday: 10:00 AM – 6:30 PM",
          "Thursday: 10:00 AM – 6:30 PM",
          "Friday: 10:00 AM – 6:30 PM",
          "Saturday: 10:00 AM – 9:00 PM",
          "Sunday: 10:00 AM – 6:30 PM"
        ],
        "id": "la-the-getty",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 180,
        "category": "museum",
        "description": "Free-admission art museum and gardens on a hilltop; parking is paid"
      },
      {
        "name": "Santa Monica Pier",
        "address": "200 Santa Monica Pier, Santa Monica, CA 90401, USA",
        "latitude": 34.008282099999995,
        "longitude": -118.4987585,
        "rating": 4.6,
        "reviewCount": 136308,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJm6deTdekwoARTY_RzhoRms0",
        "googleMapsUri": "https://maps.google.com/?cid=14815172731025329997",
        "officialWebsiteUrl": "https://santamonicapier.org/",
        "hours": [
          "Monday: 6:00 AM – 10:00 PM",
          "Tuesday: 6:00 AM – 10:00 PM",
          "Wednesday: 6:00 AM – 10:00 PM",
          "Thursday: 6:00 AM – 10:00 PM",
          "Friday: 6:00 AM – 10:00 PM",
          "Saturday: 6:00 AM – 10:00 PM",
          "Sunday: 6:00 AM – 10:00 PM"
        ],
        "id": "la-santa-monica-pier",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 90,
        "category": "beach",
        "description": "Free to walk the pier and beach; rides cost extra"
      },
      {
        "name": "Venice Beach Boardwalk",
        "address": "Beach pavillion in, 517 Ocean Front Walk, Venice, CA 90291, USA",
        "latitude": 33.9909254,
        "longitude": -118.47744390000001,
        "rating": 4.5,
        "reviewCount": 2717,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJsyUr_9y7woARG6pTv7ogvu0",
        "googleMapsUri": "https://maps.google.com/?cid=17131166019009882651",
        "officialWebsiteUrl": null,
        "hours": [],
        "id": "la-venice-beach-boardwalk",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 90,
        "category": "beach",
        "description": "Street performers, the skate park and Muscle Beach"
      },
      {
        "name": "The Broad",
        "address": "221 S Grand Ave, Los Angeles, CA 90012, USA",
        "latitude": 34.0545021,
        "longitude": -118.25018019999999,
        "rating": 4.7,
        "reviewCount": 18412,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJXaYsEk3GwoARvx7RKBUE8Zg",
        "googleMapsUri": "https://maps.google.com/?cid=11020594252077932223",
        "officialWebsiteUrl": "https://www.thebroad.org/",
        "hours": [
          "Monday: Closed",
          "Tuesday: 11:00 AM – 5:00 PM",
          "Wednesday: 11:00 AM – 5:00 PM",
          "Thursday: 11:00 AM – 8:00 PM",
          "Friday: 11:00 AM – 5:00 PM",
          "Saturday: 10:00 AM – 6:00 PM",
          "Sunday: 10:00 AM – 6:00 PM"
        ],
        "id": "la-the-broad",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 90,
        "category": "museum",
        "description": "Free contemporary art museum; reserve a timed ticket"
      },
      {
        "name": "Hollywood Walk of Fame",
        "address": "Hollywood Boulevard, Vine St, Los Angeles, CA 90028, USA",
        "latitude": 34.101605899999996,
        "longitude": -118.32956940000001,
        "rating": 4,
        "reviewCount": 62391,
        "ratingSource": "Google",
        "googlePlaceId": "ChIJXyC7WTu_woARPvVMCHBXd4U",
        "googleMapsUri": "https://maps.google.com/?cid=9617251667960198462",
        "officialWebsiteUrl": "https://walkoffame.com/",
        "hours": [
          "Monday: Open 24 hours",
          "Tuesday: Open 24 hours",
          "Wednesday: Open 24 hours",
          "Thursday: Open 24 hours",
          "Friday: Open 24 hours",
          "Saturday: Open 24 hours",
          "Sunday: Open 24 hours"
        ],
        "id": "la-hollywood-walk-of-fame",
        "estimatedCostLow": 0,
        "estimatedCostHigh": 0,
        "isFree": true,
        "durationMinutes": 45,
        "category": "sights",
        "description": "The stars along Hollywood Boulevard"
      }
    ],
    "airportRide": {
      "airport": "Los Angeles International Airport (LAX)",
      "airportLatitude": 33.942153,
      "airportLongitude": -118.40360520000002,
      "toCenterLabel": "downtown",
      "transit": {
        "summary": "A free shuttle runs from the terminals to the LAX/Metro Transit Center for the K and C Line trains; FlyAway buses also run to Union Station",
        "fare": "Metro is $1.75 with two hours of free transfers ($5 daily cap); FlyAway costs more",
        "checkUrl": "https://www.metro.net/riding/fares/",
        "checkLabel": "Check Metro",
        "note": "Fares come from 2026 travel guides; check Metro and FlyAway before you go"
      },
      "rideshare": {
        "summary": "Uber and Lyft pick up at the LAX-it lot, a free shuttle ride from the terminals (allow 15–20 minutes)",
        "fare": "About $26–42 to Santa Monica or $35–55 to Hollywood off-peak; surges at rush hour",
        "provider": "Uber"
      },
      "miles": 17,
      "sources": [
        "https://ride-again-react.lovable.app/blog/cheapest-way-from-lax",
        "https://getridewise.com/blog/cheapest-uber-lyft-lax",
        "https://www.detaileddrivers.com/blog/lax-airport-car-service-los-angeles-transportation-guide"
      ]
    }
  }
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
