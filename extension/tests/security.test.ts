import test from "node:test";
import assert from "node:assert/strict";
import { assertNoPaymentData, looksLikeCardNumber, PaymentDataError } from "../src/security/payment-guard.ts";
import { safeFacts } from "../src/security/log.ts";
import { decryptRecords, deriveKey, encryptRecords, newSalt } from "../src/security/vault.ts";

test("card numbers are recognised (Luhn + network prefix) in any format", () => {
  for (const card of ["4111 1111 1111 1111", "4111-1111-1111-1111", "5555555555554444", "378282246310005", "6011111111111117", "3530111333300000", "2223003122003222"]) {
    assert.ok(looksLikeCardNumber(card), card);
    assert.ok(looksLikeCardNumber(`my number is ${card} thanks`), card);
  }
});

test("loyalty, KTN, redress and phone numbers are not mistaken for cards", () => {
  for (const value of ["3081031234567890", "TT123456789", "123456789", "1234567", "+1 503 555 0100", "MileagePlus AB123456", "4111111111111112"]) {
    assert.ok(!looksLikeCardNumber(value), value);
  }
});

test("payment data and credentials are refused anywhere in a structure", () => {
  assert.throws(() => assertNoPaymentData({ stay: { specialRequests: "card 4111111111111111" } }), PaymentDataError);
  assert.throws(() => assertNoPaymentData({ cvv: "123" }), PaymentDataError);
  assert.throws(() => assertNoPaymentData({ nested: [{ password: "x" }] }), PaymentDataError);
  assert.throws(() => assertNoPaymentData({ otpCode: "123456" }), PaymentDataError);
  assert.throws(() => assertNoPaymentData({ iban: "x" }), PaymentDataError);
  assert.doesNotThrow(() => assertNoPaymentData({ hotelLoyalty: [{ program: "ALL", number: "3081031234567890" }] }));
});

test("the logger drops anything that could be personal", () => {
  const facts = safeFacts({ adapter: "getyourguide", filled: 4, email: "steven@example.com", name: "Steven Johnston", phone: "5035550100", ok: true, page: "details" });
  assert.deepEqual(facts, { adapter: "getyourguide", filled: 4, email: "[redacted]", name: "[redacted]", phone: "[redacted]", ok: true, page: "details" });
});

test("passport vault: AES-GCM round trip, wrong passphrase fails, ciphertext reveals nothing", async () => {
  const salt = newSalt();
  const key = await deriveKey("correct horse battery", salt, 1000);
  const records = [{ travelerId: "t_abc123", number: "X1234567", issuingCountry: "United States", nationality: "American", issueDate: "2020-01-01", expiryDate: "2030-01-01" }];
  const blob = await encryptRecords(records, key, salt, 1000);
  assert.ok(!JSON.stringify(blob).includes("X1234567"));
  assert.ok(!JSON.stringify(blob).includes("United States"));
  assert.deepEqual(await decryptRecords(blob, key), records);
  const wrong = await deriveKey("wrong passphrase!!", salt, 1000);
  await assert.rejects(() => decryptRecords(blob, wrong), /doesn't unlock/);
  await assert.rejects(() => deriveKey("short", salt, 1000), /10 characters/);
  const again = await encryptRecords(records, key, salt, 1000);
  assert.notEqual(again.iv, blob.iv, "fresh IV per write");
});
