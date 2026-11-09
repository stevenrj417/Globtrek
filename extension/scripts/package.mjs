// Zips dist/production into store-assets/globtrek-booking-assistant-<version>.zip for
// upload to the Chrome Web Store (upload is manual; nothing here submits anything).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist", "production");
const manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (manifest.version !== version) throw new Error(`manifest ${manifest.version} ≠ package ${version}; rebuild`);
if (manifest.name.includes("(dev)") || manifest.host_permissions) throw new Error("Refusing to package a development build");
const zip = join(root, "store-assets", `globtrek-booking-assistant-${version}.zip`);
if (existsSync(zip)) rmSync(zip);
execFileSync("zip", ["-r", "-X", "-q", zip, ".", "-x", "*.DS_Store"], { cwd: dist });
console.log(`Packaged ${manifest.name} ${version} → ${zip} (${Math.round(statSync(zip).size / 1024)} KB)`);
