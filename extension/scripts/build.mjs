// Builds the extension into dist/<target>/ with esbuild. No remote code, no eval,
// no minification (so Chrome Web Store reviewers can read every line).
import { build } from "esbuild";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildManifest } from "./manifest.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = (process.argv.find((arg) => arg.startsWith("--target=")) ?? "--target=production").split("=")[1];
const dev = target === "development";
const { version } = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const out = join(root, "dist", target);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

// Development-only fixture trips never ship: production builds swap the module for an empty stub.
const stripDemo = {
  name: "strip-dev-demo",
  setup(pluginBuild) {
    if (dev) return;
    pluginBuild.onLoad({ filter: /src[\\/]background[\\/]demo\.ts$/ }, () => ({ contents: "export const DEMO_TRIP = null;\nexport const SHOWCASE_TRIP = null;\n", loader: "ts" }));
  },
};

const common = {
  plugins: [stripDemo],
  bundle: true,
  target: "chrome120",
  legalComments: "none",
  minify: false,
  // Drops development-only branches from production while keeping names and layout readable.
  minifySyntax: !dev,
  sourcemap: dev ? "inline" : false,
  define: { __GLOBTREK_DEV__: String(dev), __GLOBTREK_VERSION__: JSON.stringify(version) },
  logLevel: "warning",
};

await build({ ...common, entryPoints: { background: "src/background/index.ts" }, outdir: out, format: "esm", absWorkingDir: root });
await build({ ...common, entryPoints: { "content/bridge": "src/content/bridge.ts", "content/fill": "src/content/fill.ts", assistant: "src/ui/assistant.ts", popup: "src/ui/popup.ts" }, outdir: out, format: "iife", absWorkingDir: root });

await cp(join(root, "static"), out, { recursive: true });
await writeFile(join(out, "manifest.json"), `${JSON.stringify(buildManifest({ version, dev }), null, 2)}\n`);

// Guard rails: fail the build if anything that looks like remote or dynamic code slipped in.
const forbidden = [/\beval\s*\(/, /new\s+Function\s*\(/, /\.innerHTML\s*=/, /\bimportScripts\s*\(/, /<script[^>]+src=["']https?:/i, /\bfetch\s*\(/];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(js|html)$/.test(entry.name)) {
      const text = await readFile(path, "utf8");
      const code = dev ? text.replace(/\/\/# sourceMappingURL=.*$/m, "") : text;
      for (const pattern of forbidden) if (pattern.test(code)) throw new Error(`${path} contains forbidden pattern ${pattern}`);
    }
  }
}
await walk(out);
console.log(`Built ${target} extension ${version} → ${out}`);
