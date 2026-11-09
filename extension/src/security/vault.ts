import type { PassportRecord } from "../profile/types.ts";

// Optional, off-by-default passport storage, encrypted at rest with Web Crypto:
// AES-GCM-256 with a key derived from the traveler's passphrase (PBKDF2-SHA-256,
// 600k iterations, random 16-byte salt, fresh 12-byte IV per write). The
// passphrase is never stored. While unlocked, the derived key is kept as a
// non-extractable CryptoKey in the service worker's memory only and dropped after
// inactivity. This is a convenience lock, not a password manager.

export const PBKDF2_ITERATIONS = 600_000;

export interface EncryptedBlob {
  v: 1;
  alg: "AES-GCM-256/PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  data: string;
}

function toB64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function fromB64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const out = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) out[index] = binary.charCodeAt(index);
  return out;
}

export async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, iterations = PBKDF2_ITERATIONS): Promise<CryptoKey> {
  if (passphrase.length < 10) throw new Error("Use a passphrase of at least 10 characters.");
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export function newSalt(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
}

export async function encryptRecords(records: PassportRecord[], key: CryptoKey, salt: Uint8Array<ArrayBuffer>, iterations = PBKDF2_ITERATIONS): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
  const plaintext = new TextEncoder().encode(JSON.stringify(records));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext));
  return { v: 1, alg: "AES-GCM-256/PBKDF2-SHA256", iterations, salt: toB64(salt), iv: toB64(iv), data: toB64(data) };
}

export async function decryptRecords(blob: EncryptedBlob, key: CryptoKey): Promise<PassportRecord[]> {
  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(blob.iv) }, key, fromB64(blob.data));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(plaintext));
    return Array.isArray(parsed) ? (parsed as PassportRecord[]) : [];
  } catch {
    throw new Error("That passphrase doesn't unlock the saved passports.");
  }
}

export function saltOf(blob: EncryptedBlob): Uint8Array<ArrayBuffer> {
  return fromB64(blob.salt);
}

export function isEncryptedBlob(value: unknown): value is EncryptedBlob {
  if (!value || typeof value !== "object") return false;
  const blob = value as Record<string, unknown>;
  return blob.v === 1 && typeof blob.salt === "string" && typeof blob.iv === "string" && typeof blob.data === "string" && typeof blob.iterations === "number";
}
