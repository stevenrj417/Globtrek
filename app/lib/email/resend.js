const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendEmail(message, { idempotencyKey } = {}) {
  if (!process.env.RESEND_API_KEY) throw new Error("resend_not_configured");
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
    body: JSON.stringify(message),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.message || `resend_${response.status}`);
  return result;
}

export async function sendBatchEmails(messages) {
  if (!process.env.RESEND_API_KEY) throw new Error("resend_not_configured");
  const results = [];
  for (let index = 0; index < messages.length; index += 100) {
    const response = await fetch("https://api.resend.com/emails/batch", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(messages.slice(index, index + 100)) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.message || `resend_batch_${response.status}`);
    results.push(result);
  }
  return results;
}
