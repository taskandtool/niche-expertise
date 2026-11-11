#!/usr/bin/env node
// The development loop in one process: Tailwind rebuilding static/site.css and the
// server restarting when src/ changes. data/ is read again on each refresh. This is
// what the `web` service runs on a Task & Tool machine.
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import { fail } from "../src/data/cli.mjs";
import { start } from "./lib.mjs";

start("dev", `usage: npm run dev

The web service's command, running until stopped: SITE.md's settings compiled, the
form's tables set up, Tailwind rebuilding the CSS and the server on localhost:3000
restarting on every change. Its output is the service log.`);

for (const b of ["node_modules/.bin/tailwindcss", "node_modules/.bin/tsx"]) {
  if (!existsSync(b)) fail(`dev: ${b} is missing`, "npm install, then npm run dev");
}

spawnSync("node", ["scripts/content.mjs"], { stdio: "inherit" });
spawnSync("node_modules/.bin/tsx", ["scripts/migrate.ts"], { stdio: "inherit" });
cpSync("node_modules/maplibre-gl/dist/maplibre-gl.js", "static/maplibre/maplibre-gl.js");
cpSync("node_modules/maplibre-gl/dist/maplibre-gl.css", "static/maplibre/maplibre-gl.css");

const children = [
  // `--watch=always` keeps watching when stdin is closed, as it is under a service.
  spawn("npm", ["run", "--silent", "css:watch"], { stdio: "inherit" }),
  spawn("node_modules/.bin/tsx", ["watch", "--clear-screen=false", "src/server.ts"], { stdio: "inherit" }),
];

let stopping = false;
const stop = (signal, code) => {
  if (stopping) return;
  stopping = true;
  for (const c of children) c.kill(signal);
  process.exit(code ?? 0);
};
for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => stop(s, 0));
// If either half dies, take the other down so the service restarts cleanly.
for (const c of children) c.on("exit", (code) => stop("SIGTERM", code ?? 1));
