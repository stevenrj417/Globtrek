// Serves the sanitized fixtures on http://localhost:4599 at paths that mirror each
// partner's real checkout paths, prefixed with the adapter id. Development and e2e only.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "tests", "fixtures");
const ROUTES = {
  "/booking/book.html": "booking-details.html",
  "/booking/book.html/payment": "booking-payment.html",
  "/getyourguide/checkout/fixture": "gyg-checkout.html",
  "/getyourguide/checkout/payment": "gyg-payment.html",
  "/opentable/booking/details": "opentable-details.html",
};

export function startFixtureServer(port = 4599) {
  const server = createServer(async (request, response) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    const file = ROUTES[path];
    if (!file) { response.writeHead(404, { "content-type": "text/plain" }); response.end("Not a fixture"); return; }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    response.end(await readFile(join(dir, file)));
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await startFixtureServer();
  console.log("Fixtures on http://localhost:4599 — /booking/book.html, /getyourguide/checkout/fixture, /getyourguide/checkout/payment, /opentable/booking/details");
}
