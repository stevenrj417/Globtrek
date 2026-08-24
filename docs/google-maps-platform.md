# GlobTrek Google Maps Platform

GlobTrek Trips (GTT), GlobTrek Road Trips (GTRT), and GlobTrek Cruises (GTC) share one configuration variable:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

The legacy `GOOGLE_PLACES_API_KEY` and `GOOGLE_MAPS_API_KEY` names are not supported.

The shared foundation currently powers Places API (New) location and discovery requests, exact-place and exact-property photography, the Maps JavaScript API result maps, and Routes API road geometry. Future Geocoding, Distance Matrix, Elevation, and Roads features must use the same variable rather than introducing another Google key name.

## Google Cloud restrictions

Restrict the key to GlobTrek's approved production and preview origins. API restrictions must allow only:

- Places API (New)
- Maps JavaScript API
- Routes API
- Geocoding API
- Distance Matrix API
- Maps Elevation API
- Roads API

Do not enable unrelated Google APIs. Changes to API or application restrictions are managed in Google Cloud, not in this repository.
