import { chromeAreas, loadProfile, loadSettings, loadVault, loadSessionPassports, saveProfile, saveSettings, saveSessionPassports, saveVault, deletePassports } from "../profile/store.ts";
import type { PassportRecord, Profile, Settings } from "../profile/types.ts";
import { sanitizePassports } from "../profile/sanitize.ts";
import { decryptRecords, deriveKey, encryptRecords, newSalt, saltOf } from "../security/vault.ts";

// Page-level state for the assistant. The passport key, when unlocked, lives only
// in this page's memory and is dropped after inactivity or when the page closes.

export const areas = chromeAreas();

export interface AppState {
  settings: Settings;
  profile: Profile | null;
}

export async function loadState(): Promise<AppState> {
  return { settings: await loadSettings(areas), profile: await loadProfile(areas) };
}

export { saveProfile, saveSettings };

let vaultKey: CryptoKey | null = null;
let vaultSalt: Uint8Array<ArrayBuffer> | null = null;
let lockTimer: number | undefined;
let lockMinutes = 10;
const lockListeners = new Set<() => void>();

export function onLockChange(listener: () => void): () => void {
  lockListeners.add(listener);
  return () => lockListeners.delete(listener);
}

export function isUnlocked(): boolean {
  return vaultKey !== null;
}

export function lockVault(): void {
  vaultKey = null;
  vaultSalt = null;
  window.clearTimeout(lockTimer);
  lockListeners.forEach((listener) => listener());
}

function touch(): void {
  if (!vaultKey) return;
  window.clearTimeout(lockTimer);
  lockTimer = window.setTimeout(lockVault, lockMinutes * 60_000);
}

export function startAutoLock(minutes: number): void {
  lockMinutes = minutes;
  for (const event of ["pointerdown", "keydown"]) window.addEventListener(event, touch, { passive: true });
  window.addEventListener("pagehide", lockVault);
}

export async function unlockVault(passphrase: string): Promise<PassportRecord[]> {
  const vault = await loadVault(areas);
  if (!vault) {
    // First use: create the vault with this passphrase.
    vaultSalt = newSalt();
    vaultKey = await deriveKey(passphrase, vaultSalt);
    touch();
    lockListeners.forEach((listener) => listener());
    return [];
  }
  const salt = saltOf(vault);
  const key = await deriveKey(passphrase, salt, vault.iterations);
  const records = await decryptRecords(vault, key);
  vaultKey = key;
  vaultSalt = salt;
  touch();
  lockListeners.forEach((listener) => listener());
  return records;
}

export async function readPassports(settings: Settings, travelerIds: ReadonlySet<string>): Promise<PassportRecord[] | null> {
  if (settings.passportMode === "session") return loadSessionPassports(areas, travelerIds);
  if (settings.passportMode !== "encrypted") return [];
  if (!vaultKey) return null;
  const vault = await loadVault(areas);
  touch();
  return vault ? decryptRecords(vault, vaultKey) : [];
}

export async function writePassports(settings: Settings, records: PassportRecord[], travelerIds: ReadonlySet<string>): Promise<void> {
  if (settings.passportMode === "session") { await saveSessionPassports(areas, records, travelerIds); return; }
  if (settings.passportMode !== "encrypted") throw new Error("Passport storage is off.");
  if (!vaultKey || !vaultSalt) throw new Error("Unlock passports first.");
  await saveVault(areas, await encryptRecords(sanitizePassports(records, travelerIds), vaultKey, vaultSalt));
  touch();
}

export async function removeAllPassports(): Promise<void> {
  await deletePassports(areas);
  lockVault();
}
