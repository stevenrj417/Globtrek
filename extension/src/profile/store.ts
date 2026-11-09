import { assertNoPaymentData } from "../security/payment-guard.ts";
import { isEncryptedBlob, type EncryptedBlob } from "../security/vault.ts";
import { sanitizePassports, sanitizeProfile, sanitizeSettings } from "./sanitize.ts";
import type { PassportRecord, Profile, Settings } from "./types.ts";

// Where traveler data lives:
//   chrome.storage.local   — "Save on this device": settings, profile, the encrypted passport vault.
//   chrome.storage.session — "Use once and forget": held in memory, gone when Chrome closes,
//                            and cleared by "Forget" at any time. Session-only passports live here.
// Nothing here is ever sent to GlobTrek or anyone else.

export interface StorageArea {
  get(keys: string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string[]): Promise<void>;
  clear(): Promise<void>;
}

export interface Areas {
  local: StorageArea;
  session: StorageArea;
}

export function chromeAreas(): Areas {
  return { local: chrome.storage.local as unknown as StorageArea, session: chrome.storage.session as unknown as StorageArea };
}

const K = { settings: "settings", profile: "profile", vault: "passportVault", sessionPassports: "sessionPassports", sessions: "sessions" } as const;

export async function loadSettings(areas: Areas): Promise<Settings> {
  const { settings } = await areas.local.get([K.settings]);
  return sanitizeSettings(settings);
}

export async function saveSettings(areas: Areas, next: Settings): Promise<Settings> {
  const settings = sanitizeSettings(next);
  const previous = await loadSettings(areas);
  await areas.local.set({ [K.settings]: settings });
  // Switching storage mode moves the profile, so it is never in both places.
  if (previous.storageMode !== settings.storageMode) {
    const profile = await loadProfileFrom(previous.storageMode === "device" ? areas.local : areas.session);
    await areas.local.remove([K.profile]);
    await areas.session.remove([K.profile]);
    if (profile) await (settings.storageMode === "device" ? areas.local : areas.session).set({ [K.profile]: profile });
  }
  if (settings.passportMode !== "encrypted") await areas.local.remove([K.vault]);
  if (settings.passportMode !== "session") await areas.session.remove([K.sessionPassports]);
  return settings;
}

async function loadProfileFrom(area: StorageArea): Promise<Profile | null> {
  const { profile } = await area.get([K.profile]);
  if (!profile) return null;
  try { return sanitizeProfile(profile); } catch { return null; }
}

export async function loadProfile(areas: Areas): Promise<Profile | null> {
  const settings = await loadSettings(areas);
  return loadProfileFrom(settings.storageMode === "device" ? areas.local : areas.session);
}

export async function saveProfile(areas: Areas, value: unknown): Promise<Profile> {
  const profile = sanitizeProfile(value);
  const settings = await loadSettings(areas);
  const [target, other] = settings.storageMode === "device" ? [areas.local, areas.session] : [areas.session, areas.local];
  await target.set({ [K.profile]: profile });
  await other.remove([K.profile]);
  return profile;
}

export async function loadVault(areas: Areas): Promise<EncryptedBlob | null> {
  const { [K.vault]: vault } = await areas.local.get([K.vault]);
  return isEncryptedBlob(vault) ? vault : null;
}

export async function saveVault(areas: Areas, blob: EncryptedBlob): Promise<void> {
  await areas.local.set({ [K.vault]: blob });
}

export async function deletePassports(areas: Areas): Promise<void> {
  await areas.local.remove([K.vault]);
  await areas.session.remove([K.sessionPassports]);
}

export async function loadSessionPassports(areas: Areas, travelerIds: ReadonlySet<string>): Promise<PassportRecord[]> {
  const { [K.sessionPassports]: records } = await areas.session.get([K.sessionPassports]);
  return sanitizePassports(records, travelerIds);
}

export async function saveSessionPassports(areas: Areas, records: PassportRecord[], travelerIds: ReadonlySet<string>): Promise<void> {
  await areas.session.set({ [K.sessionPassports]: sanitizePassports(records, travelerIds) });
}

/** "Forget all my information": every byte the extension stored, everywhere. */
export async function forgetEverything(areas: Areas): Promise<void> {
  await areas.local.clear();
  await areas.session.clear();
}

/** A portable copy of what's stored. Passports stay encrypted; nothing else is added. */
export async function exportData(areas: Areas): Promise<Record<string, unknown>> {
  const settings = await loadSettings(areas);
  const profile = await loadProfile(areas);
  const vault = await loadVault(areas);
  const out = { format: "globtrek-booking-assistant-export", version: 1, exportedAt: new Date().toISOString(), settings, profile, encryptedPassports: vault };
  assertNoPaymentData(out, "export");
  return out;
}

export const STORAGE_KEYS = K;
