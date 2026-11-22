import assert from "node:assert/strict";
import test from "node:test";
import { tripExtras, uberRideLink, levelFrom, cleanInterests } from "../app/lib/trip/extras.js";
import { cjTracked, withSid } from "../app/lib/booking/cj.js";
import { confirmedKinds, kindOf } from "../app/lib/booking/confirmations.js";
import { decodeBookingPage, encodeBookingPage } from "../app/lib/booking/bookPage.js";
import { itemStatus } from "../app/lib/booking/useTripStatus.js";
import { isTripRef, newTripRef, parseTripParams, stayLink, tripQuery } from "../app/lib/anyplace/trip.js";

const trip = (extra = {}) => ({
  destination: { name: "Lisbon", country: "Portugal" },
  airport: { code: "LIS", name: "Humberto Delgado Airport", latitude: 38.7742, longitude: -9.1342, km: 7 },
  stay: { name: "Casa Azul", latitude: 38.711, longitude: -9.139, street: "Rua A 1", city: "Lisbon" },
  sid: "tabcdefghij12",
  ...extra,
});
const ids = (sections) => sections.flatMap((section) => section.items.map((item) => item.id));

test("a budget trip never sees private drivers, luxury or fine dining", () => {
  const all = ids(tripExtras(trip({ level: "budget", interests: ["driver", "luxury"] })));
  for (const id of ["driver", "private-tour", "boat", "guide", "chef", "fine-dining", "taxi"]) assert.ok(!all.includes(id), id);
  assert.ok(all.includes("transit") && all.includes("cheap-eats") && all.includes("uber-arrive"));
});

test("a luxury trip gets private drivers, guides, boats and fine dining", () => {
  const all = ids(tripExtras(trip({ level: "luxury" })));
  for (const id of ["driver", "private-tour", "boat", "guide", "chef", "fine-dining", "taxi"]) assert.ok(all.includes(id), id);
  assert.ok(!all.includes("transit") && !all.includes("cheap-eats"));
});

test("what the traveler asked for in the quiz comes first in its section", () => {
  const transport = tripExtras(trip({ level: "mid", interests: ["car"] })).find((section) => section.id === "transport");
  assert.equal(transport.items[0].id, "car");
  assert.equal(transport.items[0].wanted, true);
});

test("the Uber link has pickup and drop-off filled in, and only when the airport is close", () => {
  const link = uberRideLink({ latitude: 38.7742, longitude: -9.1342, name: "LIS" }, { latitude: 38.711, longitude: -9.139, name: "Casa Azul", address: "Rua A 1, Lisbon" });
  assert.match(link, /^https:\/\/m\.uber\.com\/ul\/\?action=setPickup&pickup\[latitude\]=38\.774200&pickup\[longitude\]=-9\.134200/);
  assert.match(link, /dropoff\[nickname\]=Casa\+Azul/);
  assert.equal(uberRideLink({ latitude: null, longitude: 1 }, { latitude: 1, longitude: 1 }), null);
  const far = ids(tripExtras(trip({ level: "mid", airport: { ...trip().airport, km: 190 } })));
  assert.ok(!far.includes("uber-arrive"), "no 190 km Uber ride");
});

test("Booking.com links carry the trip reference as CJ's SID", () => {
  const taxi = tripExtras(trip({ level: "mid" })).flatMap((section) => section.items).find((item) => item.id === "taxi");
  assert.match(taxi.href, /\?sid=tabcdefghij12&url=/);
  assert.equal(cjTracked("https://www.kqzyfj.com/click-1-2", "https://www.booking.com/x", "bad id!"), "https://www.kqzyfj.com/click-1-2?sid=badid&url=https%3A%2F%2Fwww.booking.com%2Fx");
  const plain = cjTracked("https://www.kqzyfj.com/click-1-2", "https://www.booking.com/hotel/pt/a.html?checkin=2027-01-01");
  assert.equal(withSid(plain, "tabcdefghij12"), cjTracked("https://www.kqzyfj.com/click-1-2", "https://www.booking.com/hotel/pt/a.html?checkin=2027-01-01", "tabcdefghij12"));
  assert.equal(withSid("https://www.google.com/maps", "tabcdefghij12"), "https://www.google.com/maps");
});

test("the trip page keeps its reference in the URL and on the stay link", () => {
  const ref = newTripRef();
  assert.ok(isTripRef(ref));
  const parsed = parseTripParams({ budget: "mid", ref });
  assert.equal(parsed.ref, ref);
  assert.match(tripQuery(parsed), new RegExp(`ref=${ref}`));
  assert.equal(parseTripParams({ ref: "../evil" }).ref, null);
  assert.match(stayLink({ bookingUrl: "https://www.booking.com/hotel/pt/a.html", clickUrl: "x" }, { ref }), new RegExp(`sid=${ref}`));
});

test("only a sale Booking.com reported counts as confirmed, and a cancellation undoes it", () => {
  const ref = "tabcdefghij12";
  const records = [
    { shopperId: ref, advertiserName: "Booking.com", pubCommissionAmountUsd: 12 },
    { shopperId: ref, advertiserName: "Booking.com Flights", pubCommissionAmountUsd: 3 },
    { shopperId: ref, advertiserName: "Booking.com Flights", pubCommissionAmountUsd: -3 },
    { shopperId: "tsomeoneelse1", advertiserName: "Booking.com Attractions", pubCommissionAmountUsd: 4 },
  ];
  assert.deepEqual(confirmedKinds(records, ref), { stay: true });
  assert.equal(kindOf({ advertiserName: "Booking.com Attractions" }), "activity");
  assert.equal(itemStatus({ kind: "stay", checked: false, confirmed: { stay: true } }), "confirmed");
  assert.equal(itemStatus({ kind: "flight", checked: true, confirmed: { stay: true } }), "marked");
  assert.equal(itemStatus({ kind: null, checked: false, confirmed: {} }), "open");
});

test("the /book link carries the budget level, quiz extras, airport and stay point", () => {
  const manifest = { destination: { city: "Lisbon", country: "Portugal", airport: "LIS" }, dates: { start: "2027-02-01", end: "2027-02-06" }, travelers: { total: 2 }, hotelBookings: [{ type: "hotel", name: "Casa Azul", exactUrl: cjTracked("https://www.kqzyfj.com/click-1-2", "https://www.booking.com/hotel/pt/a.html") }], level: "luxury", interests: ["car", "nonsense", "esim"], stayPoint: { latitude: 38.711234, longitude: -9.139876 }, homeCountryCode: "US" };
  const decoded = decodeBookingPage(encodeBookingPage(manifest));
  assert.ok(decoded, "encodes");
  assert.equal(decoded.level, "luxury");
  assert.deepEqual(decoded.interests, ["car", "esim"]);
  assert.equal(decoded.airport, "LIS");
  assert.deepEqual(decoded.stayPoint, [38.71123, -9.13988]);
  assert.equal(decoded.homeCountryCode, "US");
});

test("budget levels from the quiz", () => {
  assert.equal(levelFrom({ band: "tight" }), "budget");
  assert.equal(levelFrom({ band: "roomy" }), "comfort");
  assert.equal(levelFrom({ band: "tight", lodging: "luxury" }), "luxury");
  assert.equal(levelFrom({ budget: "comfort" }), "comfort");
  assert.deepEqual(cleanInterests("car,rides,yacht"), ["car", "rides"]);
});
