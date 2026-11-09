// The traveler profile. It lives only on this device (or only in memory, in
// "use once" mode). Payment cards, CVV codes, partner passwords and one-time
// codes are deliberately absent from this model and rejected if they appear.

export type TravelerType = "adult" | "child" | "infant";
export type Gender = "" | "female" | "male" | "unspecified" | "undisclosed";
export type SeatPosition = "" | "window" | "aisle" | "middle";
export type SeatZone = "" | "front" | "rear" | "exit_row";

export interface LoyaltyMembership {
  program: string;
  number: string;
}

export interface Traveler {
  id: string;
  type: TravelerType;
  /** A label the traveler chose, such as "Me" or "Partner". */
  label: string;
  legalFirstName: string;
  legalMiddleName: string;
  legalLastName: string;
  preferredName: string;
  dateOfBirth: string;
  /** Only used where a partner legally requires it (for example airline Secure Flight data). */
  gender: Gender;
  relationship: string;
  guardianTravelerId: string;
  airlineLoyalty: LoyaltyMembership[];
  hotelLoyalty: LoyaltyMembership[];
  knownTravelerNumber: string;
  redressNumber: string;
  seatPosition: SeatPosition;
  seatZone: SeatZone;
  mealPreference: string;
  accessibility: string;
}

export interface Address {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface Contact {
  email: string;
  /** International calling code, e.g. "+1". */
  phoneCountryCode: string;
  phoneNumber: string;
  address: Address;
  countryOfResidence: string;
  nationality: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
}

export interface StayPreferences {
  roomPreference: string;
  bedPreference: "" | "king" | "queen" | "double" | "twin";
  arrivalTime: string;
  dietary: string;
  specialRequests: string;
}

export interface FlightPreferences {
  tripType: "" | "one_way" | "round_trip" | "multicity";
  origin: string;
  destination: string;
  includeNearbyAirports: boolean;
  departureDate: string;
  returnDate: string;
  flexibleDays: number;
  cabin: "" | "economy" | "premium_economy" | "business" | "first";
  preferredAirlines: string;
  preferredAlliances: string;
  avoidAirlines: string;
  nonstopOnly: boolean;
  maxStops: number | null;
  maxJourneyHours: number | null;
  maxLayoverHours: number | null;
  minConnectionMinutes: number | null;
  departWindow: string;
  arriveWindow: string;
  overnightOk: boolean;
  carryOnBags: number;
  checkedBags: number;
  fareFlexibility: "" | "refundable" | "changeable" | "any";
  maxBudget: number | null;
  /** Traveler ids that must be seated together. */
  seatTogether: string[];
}

export interface TravelerGroup {
  id: string;
  name: string;
  travelerIds: string[];
}

export interface Profile {
  version: 1;
  leadTravelerId: string;
  travelers: Traveler[];
  groups: TravelerGroup[];
  contact: Contact;
  stay: StayPreferences;
  flight: FlightPreferences;
  updatedAt: number;
}

export interface PassportRecord {
  travelerId: string;
  number: string;
  issuingCountry: string;
  nationality: string;
  issueDate: string;
  expiryDate: string;
}

export type StorageMode = "device" | "once";
export type PassportMode = "off" | "session" | "encrypted";

export interface Settings {
  version: 1;
  onboarded: boolean;
  storageMode: StorageMode;
  passportMode: PassportMode;
  /** Fill automatically when an opened partner page is ready (still never submits). */
  autoFill: boolean;
  autoLockMinutes: number;
}

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  onboarded: false,
  storageMode: "device",
  passportMode: "off",
  autoFill: true,
  autoLockMinutes: 10,
};

export function newId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return `${prefix}_${Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 18)}`;
}

export function emptyTraveler(type: TravelerType = "adult", label = ""): Traveler {
  return {
    id: newId("t"), type, label,
    legalFirstName: "", legalMiddleName: "", legalLastName: "", preferredName: "",
    dateOfBirth: "", gender: "", relationship: "", guardianTravelerId: "",
    airlineLoyalty: [], hotelLoyalty: [], knownTravelerNumber: "", redressNumber: "",
    seatPosition: "", seatZone: "", mealPreference: "", accessibility: "",
  };
}

export function emptyProfile(): Profile {
  const me = emptyTraveler("adult", "Me");
  return {
    version: 1,
    leadTravelerId: me.id,
    travelers: [me],
    groups: [{ id: newId("g"), name: "Me", travelerIds: [me.id] }],
    contact: {
      email: "", phoneCountryCode: "", phoneNumber: "",
      address: { line1: "", line2: "", city: "", region: "", postalCode: "", country: "" },
      countryOfResidence: "", nationality: "", emergencyName: "", emergencyRelationship: "", emergencyPhone: "",
    },
    stay: { roomPreference: "", bedPreference: "", arrivalTime: "", dietary: "", specialRequests: "" },
    flight: {
      tripType: "", origin: "", destination: "", includeNearbyAirports: false, departureDate: "", returnDate: "", flexibleDays: 0,
      cabin: "", preferredAirlines: "", preferredAlliances: "", avoidAirlines: "", nonstopOnly: false, maxStops: null,
      maxJourneyHours: null, maxLayoverHours: null, minConnectionMinutes: null, departWindow: "", arriveWindow: "",
      overnightOk: true, carryOnBags: 1, checkedBags: 0, fareFlexibility: "", maxBudget: null, seatTogether: [],
    },
    updatedAt: 0,
  };
}
