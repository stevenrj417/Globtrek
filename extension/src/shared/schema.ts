import { classifyUrl, type PartnerId } from "./partners.ts";
import { isBookingStatus, type BookingStatus } from "./status.ts";

// The versioned contract between www.glob-trek.com and the extension. Every
// message is validated field by field; anything unexpected is rejected rather
// than ignored. The website can only describe a trip — it can never send code,
// selectors, HTML, or commands that act on partner pages.

export const CHANNEL = "globtrek-booking-assistant";
export const PROTOCOL_VERSION = 1;
export const MAX_MESSAGE_BYTES = 16_384;
export const MAX_ITEMS = 12;

export type ItemType = "hotel" | "flight" | "experience" | "restaurant";
const ITEM_TYPES: readonly ItemType[] = ["hotel", "flight", "experience", "restaurant"];

export interface TripItem {
  id: string;
  type: ItemType;
  name: string;
  /** The exact approved URL, opened unchanged (CJ tracking included). */
  url: string;
  date: string | null;
  time: string | null;
}

export interface FlightSummary {
  origin: string;
  destination: string;
  departureDate: string | null;
  returnDate: string | null;
  cabin: string | null;
}

export interface TripPayload {
  tripId: string | null;
  destination: { city: string; country: string };
  dates: { start: string | null; end: string | null };
  travelers: { adults: number; children: number; infants: number };
  items: TripItem[];
  flight: FlightSummary | null;
}

export type RequestType = "PING" | "START_SESSION" | "GET_STATUS" | "OPEN_SESSION";

export type WebRequest =
  | { channel: typeof CHANNEL; v: 1; kind: "request"; requestId: string; type: "PING" }
  | { channel: typeof CHANNEL; v: 1; kind: "request"; requestId: string; type: "GET_STATUS"; sessionId: string }
  | { channel: typeof CHANNEL; v: 1; kind: "request"; requestId: string; type: "OPEN_SESSION"; sessionId: string }
  | { channel: typeof CHANNEL; v: 1; kind: "request"; requestId: string; type: "START_SESSION"; trip: TripPayload };

/** What the website may learn about a session: statuses only, never traveler data. */
export interface PublicSessionStatus {
  sessionId: string;
  items: { id: string; status: BookingStatus; partner: string; note: string | null }[];
  updatedAt: number;
}

export class SchemaError extends Error {
  readonly path: string;
  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "SchemaError";
    this.path = path;
  }
}

type Obj = Record<string, unknown>;

function isPlainObject(value: unknown): value is Obj {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function exactKeys(value: unknown, path: string, required: readonly string[], optional: readonly string[] = []): Obj {
  if (!isPlainObject(value)) throw new SchemaError(path, "must be an object");
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new SchemaError(`${path}.${key}`, "is not an expected field");
  for (const key of required) if (!(key in value)) throw new SchemaError(`${path}.${key}`, "is required");
  return value;
}

function str(value: unknown, path: string, { max, pattern, min = 0 }: { max: number; pattern?: RegExp; min?: number }): string {
  if (typeof value !== "string") throw new SchemaError(path, "must be a string");
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) throw new SchemaError(path, `must be ${min}–${max} characters`);
  if (pattern && !pattern.test(trimmed)) throw new SchemaError(path, "has an unexpected format");
  // Control characters have no business in a trip description.
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) throw new SchemaError(path, "contains control characters");
  return trimmed;
}

function nullable<T>(value: unknown, read: (v: unknown) => T): T | null {
  return value === null || value === undefined ? null : read(value);
}

function int(value: unknown, path: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) throw new SchemaError(path, `must be an integer ${min}–${max}`);
  return value;
}

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const IATA = /^[A-Z]{3}$/;
const ID = /^[A-Za-z0-9:_.-]+$/;
const REQUEST_ID = /^[A-Za-z0-9_-]{8,40}$/;
const SESSION_ID = /^s_[A-Za-z0-9_-]{16,40}$/;

function date(value: unknown, path: string): string {
  const text = str(value, path, { max: 10, pattern: DATE });
  if (Number.isNaN(Date.parse(`${text}T00:00:00Z`))) throw new SchemaError(path, "is not a real date");
  return text;
}

function validateItem(value: unknown, path: string, dev: boolean): TripItem {
  const item = exactKeys(value, path, ["id", "type", "name", "url"], ["date", "time"]);
  const type = item.type;
  if (typeof type !== "string" || !(ITEM_TYPES as readonly string[]).includes(type)) throw new SchemaError(`${path}.type`, "is not a supported booking type");
  const url = str(item.url, `${path}.url`, { max: 2048, min: 8 });
  if (!classifyUrl(url, { dev })) throw new SchemaError(`${path}.url`, "is not an approved partner link");
  return {
    id: str(item.id, `${path}.id`, { max: 64, min: 1, pattern: ID }),
    type: type as ItemType,
    name: str(item.name, `${path}.name`, { max: 120, min: 1 }),
    url,
    date: nullable(item.date, (v) => date(v, `${path}.date`)),
    time: nullable(item.time, (v) => str(v, `${path}.time`, { max: 5, pattern: TIME })),
  };
}

export function validateTrip(value: unknown, { dev = false }: { dev?: boolean } = {}): TripPayload {
  const trip = exactKeys(value, "trip", ["destination", "dates", "travelers", "items"], ["tripId", "flight"]);
  const destination = exactKeys(trip.destination, "trip.destination", ["city"], ["country"]);
  const dates = exactKeys(trip.dates, "trip.dates", [], ["start", "end"]);
  const travelers = exactKeys(trip.travelers, "trip.travelers", ["adults"], ["children", "infants"]);
  if (!Array.isArray(trip.items) || trip.items.length < 1 || trip.items.length > MAX_ITEMS) throw new SchemaError("trip.items", `must list 1–${MAX_ITEMS} bookings`);
  const items = trip.items.map((item, index) => validateItem(item, `trip.items[${index}]`, dev));
  if (new Set(items.map((item) => item.id)).size !== items.length) throw new SchemaError("trip.items", "ids must be unique");
  const start = nullable(dates.start, (v) => date(v, "trip.dates.start"));
  const end = nullable(dates.end, (v) => date(v, "trip.dates.end"));
  if (start && end && end < start) throw new SchemaError("trip.dates", "end is before start");
  let flight: FlightSummary | null = null;
  if (trip.flight !== undefined && trip.flight !== null) {
    const f = exactKeys(trip.flight, "trip.flight", ["origin", "destination"], ["departureDate", "returnDate", "cabin"]);
    flight = {
      origin: str(f.origin, "trip.flight.origin", { max: 3, pattern: IATA }),
      destination: str(f.destination, "trip.flight.destination", { max: 3, pattern: IATA }),
      departureDate: nullable(f.departureDate, (v) => date(v, "trip.flight.departureDate")),
      returnDate: nullable(f.returnDate, (v) => date(v, "trip.flight.returnDate")),
      cabin: nullable(f.cabin, (v) => str(v, "trip.flight.cabin", { max: 20, pattern: /^[A-Z_]+$/ })),
    };
  }
  return {
    tripId: nullable(trip.tripId, (v) => str(v, "trip.tripId", { max: 200 })),
    destination: {
      city: str(destination.city, "trip.destination.city", { max: 80, min: 1 }),
      country: nullable(destination.country, (v) => str(v, "trip.destination.country", { max: 80 })) ?? "",
    },
    dates: { start, end },
    travelers: {
      adults: int(travelers.adults, "trip.travelers.adults", 1, 30),
      children: travelers.children === undefined ? 0 : int(travelers.children, "trip.travelers.children", 0, 20),
      infants: travelers.infants === undefined ? 0 : int(travelers.infants, "trip.travelers.infants", 0, 10),
    },
    items,
    flight,
  };
}

export function byteLength(value: unknown): number {
  try { return new TextEncoder().encode(JSON.stringify(value)).length; } catch { return Number.POSITIVE_INFINITY; }
}

/** Validates a request from the website. Throws SchemaError with a safe message. */
export function validateWebRequest(value: unknown, { dev = false }: { dev?: boolean } = {}): WebRequest {
  if (byteLength(value) > MAX_MESSAGE_BYTES) throw new SchemaError("message", "is too large");
  const base = exactKeys(value, "message", ["channel", "v", "kind", "requestId", "type"], ["trip", "sessionId"]);
  if (base.channel !== CHANNEL) throw new SchemaError("message.channel", "is not the booking assistant channel");
  if (base.v !== PROTOCOL_VERSION) throw new SchemaError("message.v", "is an unsupported protocol version");
  if (base.kind !== "request") throw new SchemaError("message.kind", "must be request");
  const requestId = str(base.requestId, "message.requestId", { max: 40, pattern: REQUEST_ID });
  switch (base.type) {
    case "PING":
      exactKeys(value, "message", ["channel", "v", "kind", "requestId", "type"]);
      return { channel: CHANNEL, v: 1, kind: "request", requestId, type: "PING" };
    case "GET_STATUS":
      exactKeys(value, "message", ["channel", "v", "kind", "requestId", "type", "sessionId"]);
      return { channel: CHANNEL, v: 1, kind: "request", requestId, type: "GET_STATUS", sessionId: str(base.sessionId, "message.sessionId", { max: 42, pattern: SESSION_ID }) };
    case "OPEN_SESSION":
      exactKeys(value, "message", ["channel", "v", "kind", "requestId", "type", "sessionId"]);
      return { channel: CHANNEL, v: 1, kind: "request", requestId, type: "OPEN_SESSION", sessionId: str(base.sessionId, "message.sessionId", { max: 42, pattern: SESSION_ID }) };
    case "START_SESSION":
      exactKeys(value, "message", ["channel", "v", "kind", "requestId", "type", "trip"]);
      return { channel: CHANNEL, v: 1, kind: "request", requestId, type: "START_SESSION", trip: validateTrip(base.trip, { dev }) };
    default:
      throw new SchemaError("message.type", "is not a supported request");
  }
}

export function validatePublicStatus(value: unknown): PublicSessionStatus {
  const status = exactKeys(value, "status", ["sessionId", "items", "updatedAt"]);
  if (!Array.isArray(status.items)) throw new SchemaError("status.items", "must be a list");
  return {
    sessionId: str(status.sessionId, "status.sessionId", { max: 42, pattern: SESSION_ID }),
    updatedAt: int(status.updatedAt, "status.updatedAt", 0, Number.MAX_SAFE_INTEGER),
    items: status.items.map((item, index) => {
      const entry = exactKeys(item, `status.items[${index}]`, ["id", "status", "partner", "note"]);
      if (!isBookingStatus(entry.status)) throw new SchemaError(`status.items[${index}].status`, "is unknown");
      return { id: str(entry.id, "id", { max: 64, pattern: ID }), status: entry.status, partner: str(entry.partner, "partner", { max: 60 }), note: nullable(entry.note, (v) => str(v, "note", { max: 200 })) };
    }),
  };
}

// Website origins allowed to talk to the extension.
const PRODUCTION_ORIGINS = ["https://www.glob-trek.com"];
const DEV_ORIGINS = ["http://localhost:3010", "http://127.0.0.1:3010", "http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3000"];
// GlobTrek's own Vercel previews (project globtrek-potr), development builds only.
const DEV_PREVIEW = /^https:\/\/globtrek-potr-[a-z0-9-]{1,80}\.vercel\.app$/;

export function isAllowedWebOrigin(origin: string, { dev = false }: { dev?: boolean } = {}): boolean {
  if (PRODUCTION_ORIGINS.includes(origin)) return true;
  return dev && (DEV_ORIGINS.includes(origin) || DEV_PREVIEW.test(origin));
}

export type { PartnerId };
