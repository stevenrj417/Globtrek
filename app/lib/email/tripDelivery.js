import crypto from "node:crypto";

export function tripEmailIdempotencyKey(email, model) {
  return `trip-${crypto.createHash("sha256").update(`${email}:${JSON.stringify(model)}`).digest("hex").slice(0, 40)}`;
}

export function confirmEmailAccepted(provider) {
  if (!provider?.id) throw new Error("resend_acceptance_unconfirmed");
  return provider;
}
