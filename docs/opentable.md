# OpenTable integration

Globtrek uses OpenTable's official partner path for a visual website: Directory API for verified restaurant identity and reservation links, and Consumer API v2 for live availability and online reservations. The Voice AI API is not used because OpenTable restricts it to non-visual voice booking experiences.

## Approval and credentials

1. Apply at https://www.opentable.com/restaurant-solutions/api-partners/become-a-partner/ as a technology/affiliate partner.
2. Describe the use case as a consumer-facing travel itinerary website that recommends verified restaurants, shows availability, and sends diners to OpenTable to complete reservations. Request Directory API and Consumer API v2 access, including affiliate reservation links.
3. Ask OpenTable for the production and sandbox API base URLs, OAuth base URL, client ID, client secret, and affiliate referral ID. Do not guess base URLs: OpenTable documents them as partner-supplied variables.
4. Add the five `OPENTABLE_*` variables from `.env.example` to Vercel. All except the referral ID are server-only and must never use a `NEXT_PUBLIC_` prefix.
5. Apply `supabase/migrations/202608200001_restaurant_catalog.sql`. Populate rows only from approved Directory API responses or an OpenTable-provided export. Do not scrape or infer RIDs.

Until approval is complete, Globtrek keeps its existing restaurant recommendations and links. Once verified catalog rows exist, `/api/restaurants/recommend` returns them and, when a date/time and party size are supplied, enriches restaurants with Consumer API v2 availability. OpenTable booking URLs retain the official `ref` attribution value.

OpenTable requires “Powered by OpenTable” with its logo when displaying reservation links; add approved brand assets only after the partner agreement supplies their permitted form.

## Operational behavior

- OAuth client-credentials tokens are held in server memory until shortly before expiration.
- Partner API calls time out and retry transient failures and HTTP 429 responses with bounded backoff.
- Live availability is never implied when OpenTable is unavailable or credentials are missing.
- The API client implements only documented Consumer API v2 availability endpoints. Direct booking should be added only after OpenTable approves Globtrek's booking flow and provides the final contract and sandbox acceptance criteria.
