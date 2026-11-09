import type { PassportRecord, Profile, Traveler } from "./types.ts";

// Canonical names for every value an adapter may put on a partner page. Adapters
// map these to selectors; the background sends a tab only the values its adapter
// asks for, so a restaurant page never receives a passport number.

export const FIELD_LABELS = {
  "lead.firstName": "Legal first name",
  "lead.middleName": "Middle name",
  "lead.lastName": "Legal last name",
  "lead.fullName": "Full legal name",
  "lead.dateOfBirth": "Date of birth",
  "contact.email": "Email",
  "contact.phone": "Phone (with country code)",
  "contact.phoneCountryCode": "Phone country code",
  "contact.phoneNational": "Phone number",
  "contact.addressLine1": "Address line 1",
  "contact.addressLine2": "Address line 2",
  "contact.city": "City",
  "contact.region": "State or region",
  "contact.postalCode": "Postal code",
  "contact.country": "Country",
  "contact.countryOfResidence": "Country of residence",
  "contact.nationality": "Nationality",
  "stay.arrivalTime": "Arrival time",
  "stay.arrivalHour": "Arrival time (hour)",
  "stay.specialRequests": "Stay requests (room, bed, accessibility, dietary)",
  "stay.hotelLoyalty": "Hotel loyalty number",
  "dining.specialRequests": "Dining requests (dietary, accessibility)",
  "activity.comments": "Notes for the activity provider",
  "passport.number": "Passport number",
  "passport.issuingCountry": "Passport issuing country",
  "passport.expiryDate": "Passport expiry date",
} as const;

export type FieldKey = keyof typeof FIELD_LABELS;
export const SENSITIVE_FIELDS: ReadonlySet<FieldKey> = new Set(["passport.number", "passport.issuingCountry", "passport.expiryDate", "lead.dateOfBirth"]);
export const PASSPORT_FIELDS: ReadonlySet<FieldKey> = new Set(["passport.number", "passport.issuingCountry", "passport.expiryDate"]);

export function isFieldKey(value: unknown): value is FieldKey {
  return typeof value === "string" && Object.hasOwn(FIELD_LABELS, value);
}

function lead(profile: Profile): Traveler | undefined {
  return profile.travelers.find((traveler) => traveler.id === profile.leadTravelerId) ?? profile.travelers[0];
}

function joined(parts: (string | false | null | undefined)[]): string {
  return parts.filter((part): part is string => typeof part === "string" && part.trim().length > 0).join(". ");
}

const BED: Record<string, string> = { king: "King bed", queen: "Queen bed", double: "Double bed", twin: "Twin beds" };

/** "15:30", "3 PM", "3–4 PM" → the starting hour 0–23, when one can be read. */
export function arrivalHour(value: string): string {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i);
  if (!match) return "";
  let hour = Number(match[1]);
  const meridiem = (match[3] ?? "").toLowerCase().replace(/\./g, "");
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return hour >= 0 && hour <= 23 ? String(hour) : "";
}

/**
 * The values for the requested keys. Empty values are left out, so the page's
 * own field stays untouched. Passport values appear only when records are
 * passed in, which happens only after the traveler confirms for that page.
 */
export function resolveFields(profile: Profile, keys: readonly FieldKey[], passports: readonly PassportRecord[] = []): Partial<Record<FieldKey, string>> {
  const person = lead(profile);
  const { contact, stay } = profile;
  const passport = person ? passports.find((record) => record.travelerId === person.id) : undefined;
  const phoneNational = contact.phoneNumber.trim();
  const all: Record<FieldKey, string> = {
    "lead.firstName": person?.legalFirstName ?? "",
    "lead.middleName": person?.legalMiddleName ?? "",
    "lead.lastName": person?.legalLastName ?? "",
    "lead.fullName": [person?.legalFirstName, person?.legalMiddleName, person?.legalLastName].filter(Boolean).join(" "),
    "lead.dateOfBirth": person?.dateOfBirth ?? "",
    "contact.email": contact.email,
    "contact.phone": phoneNational ? `${contact.phoneCountryCode ? `${contact.phoneCountryCode} ` : ""}${phoneNational}` : "",
    "contact.phoneCountryCode": contact.phoneCountryCode,
    "contact.phoneNational": phoneNational,
    "contact.addressLine1": contact.address.line1,
    "contact.addressLine2": contact.address.line2,
    "contact.city": contact.address.city,
    "contact.region": contact.address.region,
    "contact.postalCode": contact.address.postalCode,
    "contact.country": contact.address.country || contact.countryOfResidence,
    "contact.countryOfResidence": contact.countryOfResidence,
    "contact.nationality": contact.nationality,
    "stay.arrivalTime": stay.arrivalTime,
    "stay.arrivalHour": arrivalHour(stay.arrivalTime),
    "stay.specialRequests": joined([stay.roomPreference, BED[stay.bedPreference], person?.accessibility, stay.dietary && `Dietary: ${stay.dietary}`, stay.specialRequests]),
    "stay.hotelLoyalty": person?.hotelLoyalty[0]?.number ?? "",
    "dining.specialRequests": joined([stay.dietary && `Dietary: ${stay.dietary}`, person?.accessibility]),
    "activity.comments": joined([person?.accessibility]),
    "passport.number": passport?.number ?? "",
    "passport.issuingCountry": passport?.issuingCountry ?? "",
    "passport.expiryDate": passport?.expiryDate ?? "",
  };
  const out: Partial<Record<FieldKey, string>> = {};
  for (const key of keys) {
    const value = all[key];
    if (value) out[key] = value;
  }
  return out;
}

/** The traveler-facing list of what's stored, for the privacy screen. */
export function storedFieldSummary(profile: Profile | null): { label: string; count: number }[] {
  if (!profile) return [];
  const travelers = profile.travelers;
  const count = (pick: (traveler: Traveler) => unknown) => travelers.filter((traveler) => {
    const value = pick(traveler);
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }).length;
  const rows: { label: string; count: number }[] = [
    { label: "Legal names", count: count((t) => t.legalFirstName || t.legalLastName) },
    { label: "Preferred names", count: count((t) => t.preferredName) },
    { label: "Dates of birth", count: count((t) => t.dateOfBirth) },
    { label: "Gender (where an airline requires it)", count: count((t) => t.gender) },
    { label: "Relationship or guardian", count: count((t) => t.relationship || t.guardianTravelerId) },
    { label: "Airline loyalty numbers", count: count((t) => t.airlineLoyalty) },
    { label: "Hotel loyalty numbers", count: count((t) => t.hotelLoyalty) },
    { label: "Known Traveler / redress numbers", count: count((t) => t.knownTravelerNumber || t.redressNumber) },
    { label: "Seat and meal preferences", count: count((t) => t.seatPosition || t.seatZone || t.mealPreference) },
    { label: "Accessibility requests", count: count((t) => t.accessibility) },
    { label: "Email", count: profile.contact.email ? 1 : 0 },
    { label: "Phone", count: profile.contact.phoneNumber ? 1 : 0 },
    { label: "Home address", count: profile.contact.address.line1 || profile.contact.address.city ? 1 : 0 },
    { label: "Residence and nationality", count: profile.contact.countryOfResidence || profile.contact.nationality ? 1 : 0 },
    { label: "Emergency contact", count: profile.contact.emergencyName || profile.contact.emergencyPhone ? 1 : 0 },
    { label: "Stay preferences and requests", count: Object.values(profile.stay).some(Boolean) ? 1 : 0 },
    { label: "Flight preferences", count: profile.flight.origin || profile.flight.cabin || profile.flight.preferredAirlines ? 1 : 0 },
    { label: "Traveler groups", count: profile.groups.length },
  ];
  return rows.filter((row) => row.count > 0);
}
