import { assertNoPaymentData } from "../security/payment-guard.ts";
import { DEFAULT_SETTINGS, emptyProfile, emptyTraveler, type LoyaltyMembership, type PassportRecord, type Profile, type Settings, type Traveler, type TravelerGroup } from "./types.ts";

// Turns whatever the profile editor (or an imported export file) hands us into
// a well-formed Profile: unknown keys are dropped, strings are trimmed and capped,
// enums and numbers are checked, and payment-looking data is refused outright.

const MAX_TEXT = 300;
const MAX_TRAVELERS = 12;
type Obj = Record<string, unknown>;

function obj(value: unknown): Obj {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Obj) : {};
}

function text(value: unknown, max = MAX_TEXT): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && (options as readonly string[]).includes(value) ? (value as T) : fallback;
}

function num(value: unknown, min: number, max: number): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : null;
}

function date(value: unknown): string {
  const candidate = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : "";
}

function loyalty(value: unknown): LoyaltyMembership[] {
  return (Array.isArray(value) ? value : []).slice(0, 8).map((entry) => ({ program: text(obj(entry).program, 60), number: text(obj(entry).number, 40) })).filter((entry) => entry.program || entry.number);
}

function traveler(value: unknown): Traveler {
  const input = obj(value);
  const base = emptyTraveler();
  return {
    id: /^t_[a-z0-9]{6,24}$/.test(text(input.id, 30)) ? text(input.id, 30) : base.id,
    type: oneOf(input.type, ["adult", "child", "infant"] as const, "adult"),
    label: text(input.label, 40),
    legalFirstName: text(input.legalFirstName, 80),
    legalMiddleName: text(input.legalMiddleName, 80),
    legalLastName: text(input.legalLastName, 80),
    preferredName: text(input.preferredName, 80),
    dateOfBirth: date(input.dateOfBirth),
    gender: oneOf(input.gender, ["", "female", "male", "unspecified", "undisclosed"] as const, ""),
    relationship: text(input.relationship, 60),
    guardianTravelerId: text(input.guardianTravelerId, 30),
    airlineLoyalty: loyalty(input.airlineLoyalty),
    hotelLoyalty: loyalty(input.hotelLoyalty),
    knownTravelerNumber: text(input.knownTravelerNumber, 25).replace(/\s/g, ""),
    redressNumber: text(input.redressNumber, 25).replace(/\s/g, ""),
    seatPosition: oneOf(input.seatPosition, ["", "window", "aisle", "middle"] as const, ""),
    seatZone: oneOf(input.seatZone, ["", "front", "rear", "exit_row"] as const, ""),
    mealPreference: text(input.mealPreference, 60),
    accessibility: text(input.accessibility, 500),
  };
}

export function sanitizeProfile(value: unknown): Profile {
  const input = obj(value);
  const base = emptyProfile();
  const travelers = (Array.isArray(input.travelers) ? input.travelers : []).slice(0, MAX_TRAVELERS).map(traveler);
  if (!travelers.length) travelers.push(...base.travelers);
  const ids = new Set(travelers.map((entry) => entry.id));
  for (const entry of travelers) if (!ids.has(entry.guardianTravelerId)) entry.guardianTravelerId = "";
  const groups: TravelerGroup[] = (Array.isArray(input.groups) ? input.groups : []).slice(0, 10).map((entry) => {
    const group = obj(entry);
    return {
      id: text(group.id, 30) || `g_${Math.random().toString(36).slice(2, 12)}`,
      name: text(group.name, 40),
      travelerIds: (Array.isArray(group.travelerIds) ? group.travelerIds : []).map((id) => text(id, 30)).filter((id) => ids.has(id)),
    };
  }).filter((group) => group.name);
  const contact = obj(input.contact);
  const address = obj(contact.address);
  const stay = obj(input.stay);
  const flight = obj(input.flight);
  const lead = text(input.leadTravelerId, 30);
  const profile: Profile = {
    version: 1,
    leadTravelerId: ids.has(lead) ? lead : travelers[0]!.id,
    travelers,
    groups,
    contact: {
      email: text(contact.email, 120),
      phoneCountryCode: /^\+\d{1,4}$/.test(text(contact.phoneCountryCode, 5)) ? text(contact.phoneCountryCode, 5) : "",
      phoneNumber: text(contact.phoneNumber, 25).replace(/[^\d ()-]/g, ""),
      address: { line1: text(address.line1, 120), line2: text(address.line2, 120), city: text(address.city, 80), region: text(address.region, 80), postalCode: text(address.postalCode, 20), country: text(address.country, 60) },
      countryOfResidence: text(contact.countryOfResidence, 60),
      nationality: text(contact.nationality, 60),
      emergencyName: text(contact.emergencyName, 120),
      emergencyRelationship: text(contact.emergencyRelationship, 60),
      emergencyPhone: text(contact.emergencyPhone, 30),
    },
    stay: {
      roomPreference: text(stay.roomPreference, 200),
      bedPreference: oneOf(stay.bedPreference, ["", "king", "queen", "double", "twin"] as const, ""),
      arrivalTime: text(stay.arrivalTime, 40),
      dietary: text(stay.dietary, 200),
      specialRequests: text(stay.specialRequests, 500),
    },
    flight: {
      tripType: oneOf(flight.tripType, ["", "one_way", "round_trip", "multicity"] as const, ""),
      origin: text(flight.origin, 3).toUpperCase().replace(/[^A-Z]/g, ""),
      destination: text(flight.destination, 3).toUpperCase().replace(/[^A-Z]/g, ""),
      includeNearbyAirports: flight.includeNearbyAirports === true,
      departureDate: date(flight.departureDate),
      returnDate: date(flight.returnDate),
      flexibleDays: num(flight.flexibleDays, 0, 7) ?? 0,
      cabin: oneOf(flight.cabin, ["", "economy", "premium_economy", "business", "first"] as const, ""),
      preferredAirlines: text(flight.preferredAirlines, 120),
      preferredAlliances: text(flight.preferredAlliances, 80),
      avoidAirlines: text(flight.avoidAirlines, 120),
      nonstopOnly: flight.nonstopOnly === true,
      maxStops: num(flight.maxStops, 0, 3),
      maxJourneyHours: num(flight.maxJourneyHours, 1, 60),
      maxLayoverHours: num(flight.maxLayoverHours, 1, 24),
      minConnectionMinutes: num(flight.minConnectionMinutes, 30, 600),
      departWindow: text(flight.departWindow, 40),
      arriveWindow: text(flight.arriveWindow, 40),
      overnightOk: flight.overnightOk !== false,
      carryOnBags: num(flight.carryOnBags, 0, 3) ?? 1,
      checkedBags: num(flight.checkedBags, 0, 5) ?? 0,
      fareFlexibility: oneOf(flight.fareFlexibility, ["", "refundable", "changeable", "any"] as const, ""),
      maxBudget: num(flight.maxBudget, 0, 100_000),
      seatTogether: (Array.isArray(flight.seatTogether) ? flight.seatTogether : []).map((id) => text(id, 30)).filter((id) => ids.has(id)),
    },
    updatedAt: Date.now(),
  };
  assertNoPaymentData(profile);
  return profile;
}

export function sanitizePassports(value: unknown, travelerIds: ReadonlySet<string>): PassportRecord[] {
  const records = (Array.isArray(value) ? value : []).slice(0, 12).map((entry) => {
    const record = obj(entry);
    return {
      travelerId: text(record.travelerId, 30),
      number: text(record.number, 20).toUpperCase().replace(/[^A-Z0-9]/g, ""),
      issuingCountry: text(record.issuingCountry, 60),
      nationality: text(record.nationality, 60),
      issueDate: date(record.issueDate),
      expiryDate: date(record.expiryDate),
    };
  }).filter((record) => travelerIds.has(record.travelerId) && record.number);
  assertNoPaymentData(records, "passports");
  return records;
}

export function sanitizeSettings(value: unknown): Settings {
  const input = obj(value);
  return {
    version: 1,
    onboarded: input.onboarded === true,
    storageMode: oneOf(input.storageMode, ["device", "once"] as const, DEFAULT_SETTINGS.storageMode),
    passportMode: oneOf(input.passportMode, ["off", "session", "encrypted"] as const, "off"),
    autoFill: input.autoFill !== false,
    autoLockMinutes: num(input.autoLockMinutes, 1, 60) ?? DEFAULT_SETTINGS.autoLockMinutes,
  };
}
