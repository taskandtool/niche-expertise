// Builds the site for production:
//   dist/             every page pre-rendered to HTML, the static files and pictures,
//                     the lists the browser filters, the sitemaps, and Pagefind's index
//   build/worker.mjs  the correction form and the 404 page, for paths with no file
// `npm run deploy` runs it too.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { build } from "esbuild";
import { done, fail } from "../src/data/cli.mjs";
import { at, start } from "./lib.mjs";

start("build", `usage: npm run build

Compiles SITE.md's settings and the CSS, pre-renders every page in data/ to dist/ with
its sitemaps, runs Pagefind over them, and bundles the Worker to build/worker.mjs. Prints
one line of what it built. A failure says which step, on stderr, and exits 1.`, { tryHelp: "npm run build -- --help" });

const dist = at("dist");

function run(step: string, cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, { encoding: "utf8", env: process.env });
  if (r.status !== 0) fail(`build: the ${step} step failed\n${`${r.stdout || ""}${r.stderr || ""}`.trim()}`, `npm run ${step}`);
}

run("content", "node", ["scripts/content.mjs"]);
run("css", "npm", ["run", "--silent", "css"]);

const { default: app, routes, sitemaps, robots } = await import("../src/app");
const all = routes();
const paths = new Set<string>();
for (const r of all) {
  if (paths.has(r.page.path)) fail(`build: two pages claim ${r.page.path}`, "two names slug to the same address: merge them in aliases.yaml");
  paths.add(r.page.path);
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync("static", dist, { recursive: true });
if (existsSync(at("static", "media"))) cpSync(at("static", "media"), join(dist, "media"), { recursive: true });
cpSync("node_modules/maplibre-gl/dist/maplibre-gl.js", join(dist, "maplibre", "maplibre-gl.js"));
cpSync("node_modules/maplibre-gl/dist/maplibre-gl.css", join(dist, "maplibre", "maplibre-gl.css"));
mkdirSync(join(dist, "filters"), { recursive: true });
for (const f of ["list-companies", "filters", "zips", "area-shapes", "search"]) {
  if (existsSync(at("data", `${f}.json`))) cpSync(at("data", `${f}.json`), join(dist, "filters", `${f}.json`));
}

for (const r of all) {
  const res = await app.request(r.page.path);
  if (res.status !== 200) fail(`build: ${r.page.path} rendered with status ${res.status}`, `curl -si http://localhost:3000${r.page.path} | head -20`);
  const file = r.page.path === "/" ? "index.html" : `${r.page.path.slice(1)}.html`;
  mkdirSync(dirname(join(dist, file)), { recursive: true });
  writeFileSync(join(dist, file), await res.text());
}
const nf = await app.request("/this-page-does-not-exist");
writeFileSync(join(dist, "404.html"), await nf.text());
for (const [name, xml] of Object.entries(sitemaps())) writeFileSync(join(dist, name), xml);
writeFileSync(join(dist, "robots.txt"), robots());

run("pagefind", "node_modules/.bin/pagefind", ["--site", dist]);

mkdirSync(at("build"), { recursive: true });
try {
  await build({
    entryPoints: ["src/worker.ts"],
    bundle: true,
    format: "esm",
    outfile: at("build", "worker.mjs"),
    platform: "browser",
    conditions: ["workerd", "worker", "browser"],
    target: "es2022",
    jsx: "automatic",
    jsxImportSource: "hono/jsx",
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "silent",
  });
} catch (e) {
  fail(`build: the Worker did not bundle\n${e instanceof Error ? e.message : String(e)}`, "npm run check, which finds a Node import the Worker reaches");
}

done("build", `${all.length} pages + 404 to dist/, Worker to build/worker.mjs`, { next: "npm run check -- --built" });
