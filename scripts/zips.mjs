#!/usr/bin/env node
// Which ZIP codes make up a city or county, and which city a ZIP is in, from public Census files.
import { flag, has, done, fail, misused, noMore, parseArgs, usage } from "../src/data/cli.mjs";
import { loadZipMap, saveZipFiles, zipFilesSaved } from "./zipmap.mjs";

const HELP = `usage: node scripts/zips.mjs <command> [--json]

  city <name> --state TX
  county <name> --state TX
      The ZIP codes that make up that city or county.
  zip <12345>
      The cities and counties a ZIP code belongs to, the main one first.
  sync
      Downloads the Census's files to raw/geo/, once. The others do this when they need to. Free.

A ZIP counts when at least 10% of it, or 10% of the place, lies in the other, so one
that only touches the edge stays out. No AI and no connection. Exit 0 found, 1 not
found or could not download, 2 misused.`;

const a = parseArgs(process.argv.slice(2), { bare: ["json"] });
const [cmd, ...rest] = a._;
usage(a, cmd, ["city", "county", "zip", "sync"], HELP, "zips", { city: ["state", "json"], county: ["state", "json"], zip: ["json"], sync: ["json"] });

const missing = () => {
  const failed = saveZipFiles();
  if (failed.length && !zipFilesSaved()) fail(`zips: could not download the Census's files\n  ${failed.join("\n  ")}`, "node scripts/zips.mjs sync");
};
const say = (obj, line) => (has(a, "json") ? console.log(JSON.stringify(obj)) : line());

if (cmd === "sync") {
  noMore(rest, 0, "zips sync");
  missing();
  done("zips sync", "the Census's ZIP files are in raw/geo/", { next: 'node scripts/zips.mjs city "Round Rock" --state TX' });
} else if (cmd === "zip") {
  noMore(rest, 1, "zips zip");
  if (!/^\d{5}$/.test(rest[0] ?? "")) misused("zips zip: name five digits", "node scripts/zips.mjs zip 78664");
  missing();
  const places = loadZipMap().placesOf(rest[0]);
  if (!places.length) fail(`zips zip: ${rest[0]} is not in the Census's list`, 'node scripts/zips.mjs city "<name>" --state TX, to see a place\'s ZIPs');
  say({ zip: rest[0], places: places.map((p) => ({ name: p.name, state: p.state, kind: p.kind, share: Number(p.share.toFixed(2)) })) }, () => {
    console.log(`zips: ${rest[0]}`);
    for (const p of places) console.log(`  ${p.name}, ${p.state} (${Math.round(p.share * 100)}% of the ZIP)`);
  });
} else {
  const name = rest.join(" ");
  const state = flag(a, "state");
  if (!name || !/^[A-Za-z]{2}$/.test(state ?? "")) misused(`zips ${cmd}: name it, with its state`, `node scripts/zips.mjs ${cmd} "${cmd === "city" ? "Round Rock" : "Williamson County"}" --state TX`);
  missing();
  const zips = loadZipMap().zipsOf(name, state);
  if (!zips.length) fail(`zips ${cmd}: no ZIP codes for ${name}, ${state.toUpperCase()}`, `check the spelling; a county is "Williamson County"`);
  say({ name, state: state.toUpperCase(), zips }, () => console.log(`zips: ${name}, ${state.toUpperCase()}: ${zips.length} ZIP codes\n  ${zips.join(" ")}`));
}
