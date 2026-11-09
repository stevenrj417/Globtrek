import test from "node:test";
import assert from "node:assert/strict";
import { memoryAreas, sampleProfile } from "./helpers.ts";
import { exportData, forgetEverything, loadProfile, loadSettings, saveProfile, saveSettings, saveVault, loadVault, deletePassports, saveSessionPassports, loadSessionPassports } from "../src/profile/store.ts";
import { sanitizeProfile } from "../src/profile/sanitize.ts";
import { arrivalHour, resolveFields, storedFieldSummary } from "../src/profile/fields.ts";
import { PaymentDataError } from "../src/security/payment-guard.ts";
import { deriveKey, encryptRecords, newSalt } from "../src/security/vault.ts";

test("sanitizing drops unknown keys, caps text, validates enums and links", () => {
  const dirty = { ...sampleProfile(), extra: "x", travelers: [{ ...sampleProfile().travelers[0], type: "alien", seatPosition: "wing", legalFirstName: " Ana\u0007 ", guardianTravelerId: "t_missing" }] };
  const clean = sanitizeProfile(dirty);
  assert.equal("extra" in clean, false);
  assert.equal(clean.travelers[0]!.type, "adult");
  assert.equal(clean.travelers[0]!.seatPosition, "");
  assert.equal(clean.travelers[0]!.legalFirstName, "Ana");
  assert.equal(clean.travelers[0]!.guardianTravelerId, "");
});

test("a card number typed into any profile field is refused, not stored", async () => {
  const areas = memoryAreas();
  const profile = sampleProfile();
  profile.stay.specialRequests = "charge 4111 1111 1111 1111";
  await assert.rejects(() => saveProfile(areas, profile), PaymentDataError);
  assert.deepEqual(areas.local.dump(), {});
});

test("Save on this device vs Use once and forget", async () => {
  const areas = memoryAreas();
  await saveSettings(areas, { ...(await loadSettings(areas)), storageMode: "device", onboarded: true });
  await saveProfile(areas, sampleProfile());
  assert.ok(areas.local.dump().profile, "device mode writes to local storage");
  assert.equal(areas.session.dump().profile, undefined);
  await saveSettings(areas, { ...(await loadSettings(areas)), storageMode: "once" });
  assert.equal(areas.local.dump().profile, undefined, "switching to use-once removes it from disk");
  assert.ok(areas.session.dump().profile, "and keeps it in memory for this session");
  assert.equal((await loadProfile(areas))?.contact.email, "ana@example.com");
});

test("Forget all my information erases every stored byte", async () => {
  const areas = memoryAreas();
  await saveSettings(areas, { ...(await loadSettings(areas)), passportMode: "encrypted", onboarded: true });
  await saveProfile(areas, sampleProfile());
  const salt = newSalt();
  await saveVault(areas, await encryptRecords([], await deriveKey("a long passphrase", salt, 1000), salt, 1000));
  await areas.local.set({ sessions: { s_x: {} } });
  await areas.session.set({ sessionPassports: [] });
  await forgetEverything(areas);
  assert.deepEqual(areas.local.dump(), {});
  assert.deepEqual(areas.session.dump(), {});
  assert.equal(await loadProfile(areas), null);
});

test("passports: off by default, deletable, session-only records validated", async () => {
  const areas = memoryAreas();
  assert.equal((await loadSettings(areas)).passportMode, "off");
  const profile = await saveProfile(areas, sampleProfile());
  const ids = new Set(profile.travelers.map((t) => t.id));
  await saveSessionPassports(areas, [{ travelerId: profile.leadTravelerId, number: "x123 4567", issuingCountry: "PT", nationality: "PT", issueDate: "", expiryDate: "2031-01-01" }, { travelerId: "t_stranger", number: "Z1", issuingCountry: "", nationality: "", issueDate: "", expiryDate: "" }], ids);
  const records = await loadSessionPassports(areas, ids);
  assert.equal(records.length, 1);
  assert.equal(records[0]!.number, "X1234567");
  await deletePassports(areas);
  assert.deepEqual(await loadSessionPassports(areas, ids), []);
  assert.equal(await loadVault(areas), null);
  await saveSettings(areas, { ...(await loadSettings(areas)), passportMode: "off" });
});

test("export contains the profile and settings, passports only encrypted, and no card data", async () => {
  const areas = memoryAreas();
  await saveProfile(areas, sampleProfile());
  const exported = await exportData(areas);
  assert.equal(exported.format, "globtrek-booking-assistant-export");
  assert.equal((exported.profile as { contact: { email: string } }).contact.email, "ana@example.com");
  assert.equal(exported.encryptedPassports, null);
});

test("resolveFields returns only requested keys and composes requests", () => {
  const profile = sanitizeProfile(sampleProfile());
  const values = resolveFields(profile, ["lead.firstName", "contact.phone", "stay.specialRequests", "stay.arrivalHour", "passport.number"]);
  assert.deepEqual(Object.keys(values).sort(), ["contact.phone", "lead.firstName", "stay.arrivalHour", "stay.specialRequests"]);
  assert.equal(values["contact.phone"], "+351 912 345 678");
  assert.equal(values["stay.arrivalHour"], "15");
  assert.match(values["stay.specialRequests"]!, /King bed.*Step-free room.*Dietary: vegetarian.*Quiet room/);
  assert.equal(resolveFields(profile, ["passport.number"], [{ travelerId: profile.leadTravelerId, number: "X1", issuingCountry: "", nationality: "", issueDate: "", expiryDate: "" }])["passport.number"], "X1");
});

test("arrival hour parsing", () => {
  assert.equal(arrivalHour("15:30"), "15");
  assert.equal(arrivalHour("3 PM"), "15");
  assert.equal(arrivalHour("12 am"), "0");
  assert.equal(arrivalHour("late"), "");
});

test("stored-field summary lists categories without values", () => {
  const summary = storedFieldSummary(sanitizeProfile(sampleProfile()));
  assert.ok(summary.some((row) => row.label === "Legal names" && row.count === 2));
  assert.ok(!JSON.stringify(summary).includes("ana@example.com"));
});
