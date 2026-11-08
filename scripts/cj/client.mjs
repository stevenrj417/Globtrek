// Minimal CJ GraphQL client for scripts. Reads credentials from the environment
// or .env.local; never prints them.
import { readFile } from "node:fs/promises";

async function envFile() {
  try {
    const text = await readFile(new URL("../../.env.local", import.meta.url), "utf8");
    return Object.fromEntries(text.split("\n").map((line) => line.match(/^([A-Z_]+)=["']?([^"'\n]*)/)).filter(Boolean).map((m) => [m[1], m[2]]));
  } catch {
    return {};
  }
}

const file = await envFile();
export const CJ = {
  token: process.env.CJ_API_TOKEN || file.CJ_API_TOKEN,
  companyId: process.env.CJ_COMPANY_ID || file.CJ_COMPANY_ID,
  pid: process.env.CJ_PID || file.CJ_PID,
};

export async function cjQuery(query) {
  if (!CJ.token) throw new Error("Set CJ_API_TOKEN in .env.local");
  let response;
  let text;
  for (let attempt = 1; ; attempt += 1) {
    try {
      response = await fetch("https://ads.api.cj.com/query", { method: "POST", headers: { Authorization: `Bearer ${CJ.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query }), signal: AbortSignal.timeout(90000) });
      text = await response.text();
      break;
    } catch (error) {
      if (attempt >= 3) throw error;
    }
  }
  let payload = null;
  try { payload = JSON.parse(text); } catch {}
  if (!response.ok || payload?.errors?.length) throw new Error(`cj_${response.status}: ${(payload?.errors ? JSON.stringify(payload.errors) : text).slice(0, 600)}`);
  return payload.data;
}
