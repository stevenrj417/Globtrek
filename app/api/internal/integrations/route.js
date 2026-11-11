import { groupedPrices, latestPrices, nearestPlaces, popularDirections, pricesForDates, searchByPriceRange, specialOffers, statisticsFields, travelpayoutsConfig, travelpayoutsRequest } from "../../../lib/travelpayouts/client.js";

export const dynamic = "force-dynamic";

// Integration self-test. Exists only on preview deployments (which sit behind
// Vercel deployment protection); production and local builds return 404. It
// reports whether each provider answered and a small sample, never credentials.

async function check(name, run) {
  const started = Date.now();
  try {
    const result = await run();
    return { name, ok: true, ms: Date.now() - started, ...result };
  } catch (error) {
    return { name, ok: false, ms: Date.now() - started, error: error?.code || error?.message?.slice(0, 80) || "failed", status: error?.status || null };
  }
}

const sample = (items) => ({ count: items.length, sample: items.slice(0, 2) });

export async function GET(request) {
  if (process.env.VERCEL_ENV !== "preview") return new Response("Not found", { status: 404 });
  const { token, marker, projectId } = travelpayoutsConfig();
  const month = new URL(request.url).searchParams.get("month") || "2027-03";
  const checks = await Promise.all([
    check("prices_for_dates", async () => sample(await pricesForDates({ token, origin: "LAX", destination: "LIS", departureAt: month, returnAt: month }))),
    check("grouped_prices", async () => sample(await groupedPrices({ token, origin: "LAX", destination: "LIS", departureAt: month, minTripDays: 4, maxTripDays: 8 }))),
    check("get_latest_prices", async () => sample(await latestPrices({ token, origin: "LAX", destination: "LIS", beginningOfPeriod: `${month}-01` }))),
    check("search_by_price_range", async () => sample(await searchByPriceRange({ token, origin: "LAX", valueMin: 100, valueMax: 600 }))),
    check("get_popular_directions", async () => sample(await popularDirections({ token, destination: "LIS" }))),
    check("get_special_offers", async () => sample(await specialOffers({ token, origin: "LAX" }))),
    check("nearest_places_matrix", async () => sample(await nearestPlaces({ token, origin: "LAX", destination: "LIS" }))),
    check("statistics_fields", async () => ({ count: (await statisticsFields({ token })).length })),
    check("links_create", async () => {
      const urls = [
        `https://www.aviasales.com/search/LAX1503LIS221`,
        "https://wegotrip.com/barcelona-d3128760/picasso-museum-and-el-born-see-the-colors-of-barcelona-p3471/",
        "https://www.airalo.com/portugal-esim",
        "https://en.intui.travel/transfer/portugal/",
        "https://www.booking.com/city/pt/lisbon.html",
      ];
      const json = await travelpayoutsRequest("/links/v1/create", { token, body: { trs: Number(projectId), marker: Number(marker), shorten: false, links: urls.map((url) => ({ url, sub_id: "selftest" })) } });
      return {
        markerNumeric: /^\d+$/.test(marker),
        projectNumeric: /^\d+$/.test(projectId),
        links: (json?.result?.links || []).map((link) => ({ url: link.url, code: link.code, message: link.message || null, partnerHost: link.partner_url ? new URL(link.partner_url).hostname : null, partnerUrl: link.partner_url || null })),
      };
    }),
    check("hotellook_cache", async () => {
      const url = new URL("https://engine.hotellook.com/api/v2/cache.json");
      for (const [key, value] of Object.entries({ location: "Lisbon", checkIn: `${month}-10`, checkOut: `${month}-15`, currency: "usd", limit: "3" })) url.searchParams.set(key, value);
      const response = await fetch(url, { headers: { "X-Access-Token": token }, cache: "no-store" });
      const body = await response.json().catch(() => null);
      return { status: response.status, count: Array.isArray(body) ? body.length : null, sample: Array.isArray(body) ? body.slice(0, 2).map((item) => ({ hotelName: item.hotelName, stars: item.stars, priceAvg: item.priceAvg, priceFrom: item.priceFrom })) : String(JSON.stringify(body)).slice(0, 160) };
    }),
    check("fares_route", async () => {
      const { recentFares } = await import("../../../lib/travelpayouts/fares.js");
      const fares = await recentFares({ token, origin: "LAX", destination: "LAS", months: ["2026-12", "2027-01"], nights: 3, adults: 2 });
      return { count: fares.length, sample: fares.slice(0, 2) };
    }),
    check("duffel", async () => {
      const value = process.env.DUFFEL_ACCESS_TOKEN || "";
      if (!value) return { configured: false };
      // Read-only reference data: no search, order or payment, so no charge.
      const response = await fetch("https://api.duffel.com/air/airlines?limit=1", { headers: { Authorization: `Bearer ${value}`, "Duffel-Version": "v2", Accept: "application/json" }, cache: "no-store" });
      return { configured: true, mode: value.startsWith("duffel_test_") ? "test" : value.startsWith("duffel_live_") ? "live" : "unknown", status: response.status, authorized: response.ok };
    }),
  ]);
  return Response.json({ time: new Date().toISOString(), month, checks }, { headers: { "Cache-Control": "no-store" } });
}
