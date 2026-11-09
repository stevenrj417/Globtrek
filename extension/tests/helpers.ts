import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
import type { Areas, StorageArea } from "../src/profile/store.ts";
import { emptyProfile, emptyTraveler } from "../src/profile/types.ts";

export function memoryArea(): StorageArea & { dump(): Record<string, unknown> } {
  let data: Record<string, unknown> = {};
  return {
    async get(keys) { return Object.fromEntries(keys.filter((key) => key in data).map((key) => [key, structuredClone(data[key])])); },
    async set(items) { data = { ...data, ...structuredClone(items) }; },
    async remove(keys) { for (const key of keys) delete data[key]; },
    async clear() { data = {}; },
    dump() { return structuredClone(data); },
  };
}

export function memoryAreas(): Areas & { local: ReturnType<typeof memoryArea>; session: ReturnType<typeof memoryArea> } {
  return { local: memoryArea(), session: memoryArea() };
}

export function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

/** A DOM for a fixture, served as if from `url`. Fixture scripts do not run. */
export function domFor(name: string, url: string): { window: Window; document: Document } {
  const window = new Window({ url, settings: { disableJavaScriptEvaluation: true, disableCSSFileLoading: true, disableIframePageLoading: true, navigation: { disableChildFrameNavigation: true, disableChildPageNavigation: true, disableMainFrameNavigation: true } } });
  const html = fixture(name).replace(/<script[\s\S]*?<\/script>/g, "");
  window.document.write(html);
  return { window, document: window.document as unknown as Document };
}

export function sampleProfile() {
  const profile = emptyProfile();
  const me = profile.travelers[0]!;
  Object.assign(me, { legalFirstName: "Ana", legalMiddleName: "Maria", legalLastName: "Costa", dateOfBirth: "1990-05-01", accessibility: "Step-free room please", hotelLoyalty: [{ program: "ALL", number: "3081031234567890" }] });
  const kid = { ...emptyTraveler("child", "Leo"), legalFirstName: "Leo", legalLastName: "Costa", guardianTravelerId: me.id };
  profile.travelers.push(kid);
  Object.assign(profile.contact, { email: "ana@example.com", phoneCountryCode: "+351", phoneNumber: "912 345 678", countryOfResidence: "Portugal" });
  Object.assign(profile.contact.address, { line1: "Rua Augusta 1", city: "Lisboa", postalCode: "1100-048", country: "Portugal" });
  Object.assign(profile.stay, { bedPreference: "king", arrivalTime: "3 PM", dietary: "vegetarian", specialRequests: "Quiet room" });
  return profile;
}

