// The extension never stores card numbers, CVV codes, banking credentials,
// partner passwords or one-time codes. This guard runs on everything before it
// is written to storage and on every key name the profile editor sends.

const FORBIDDEN_KEY = /(card.?number|cc.?num|\bpan\b|cvv|cvc|csc|security.?code|iban|routing|account.?number|password|passcode|otp|one.?time|2fa|mfa|\bpin\b|pin.?code)/i;

function luhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = digits.charCodeAt(index) - 48;
    if (double) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

// Issuer prefixes of the major card networks (Visa, Mastercard, Amex, Discover,
// JCB, Diners, UnionPay). Loyalty numbers outside these ranges pass.
const CARD_PREFIX = /^(4|5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720)|3[47]|6011|64[4-9]|65|35(2[89]|[3-8]\d)|30[0-5]|3095|36|3[89]|62)/;

/** True when a string contains something shaped like a payment card number. */
export function looksLikeCardNumber(value: string): boolean {
  const candidates = value.match(/(?:\d[ -]?){13,19}/g) ?? [];
  return candidates.some((candidate) => {
    const digits = candidate.replace(/\D/g, "");
    return digits.length >= 13 && digits.length <= 19 && CARD_PREFIX.test(digits) && luhn(digits);
  });
}

export class PaymentDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentDataError";
  }
}

function where(path: string): string {
  const last = path.split(".").pop()?.replace(/\[\d+\]$/, "") ?? "";
  return last.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

/** Throws if any key or string value in `value` looks like payment or credential data. */
export function assertNoPaymentData(value: unknown, path = "profile"): void {
  if (typeof value === "string") {
    if (looksLikeCardNumber(value)) throw new PaymentDataError(`Something in “${where(path)}” looks like a payment card number, so it wasn't saved. GlobTrek never stores card details — Chrome's payment autofill or the partner's checkout handles payment.`);
    return;
  }
  if (Array.isArray(value)) { value.forEach((entry, index) => assertNoPaymentData(entry, `${path}[${index}]`)); return; }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (FORBIDDEN_KEY.test(key)) throw new PaymentDataError(`“${where(`${path}.${key}`)}” is a kind of data GlobTrek never stores.`);
      assertNoPaymentData(entry, `${path}.${key}`);
    }
  }
}
