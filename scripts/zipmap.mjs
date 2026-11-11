// ZIP codes and the places they belong to, from the Census's public relationship files. No AI:
// a ZIP belongs to a city or county when a real share of one lies in the other, so a ZIP that
// only touches a city's edge stays out. Shared by scripts/zips.mjs and the build.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { at } from "./lib.mjs";

const CENSUS = "https://www2.census.gov/geo/docs/maps-data/data";
const FILES = {
  "zcta.txt": `${CENSUS}/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip`,
  "zip-place.txt": `${CENSUS}/rel2020/zcta520/tab20_zcta520_place20_natl.txt`,
  "zip-county.txt": `${CENSUS}/rel2020/zcta520/tab20_zcta520_county20_natl.txt`,
};
const FETCH = "import io,sys,urllib.request,zipfile;b=urllib.request.urlopen(sys.argv[1],timeout=180).read();b=zipfile.ZipFile(io.BytesIO(b)).read(zipfile.ZipFile(io.BytesIO(b)).namelist()[0]) if sys.argv[1].endswith('.zip') else b;open(sys.argv[2],'wb').write(b)";
/** Below this share of the ZIP and of the place, the two only touch. */
const SHARE = 0.1;

const FIPS = { "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", 10: "DE", 11: "DC", 12: "FL", 13: "GA", 15: "HI", 16: "ID", 17: "IL", 18: "IN", 19: "IA", 20: "KS", 21: "KY", 22: "LA", 23: "ME", 24: "MD", 25: "MA", 26: "MI", 27: "MN", 28: "MS", 29: "MO", 30: "MT", 31: "NE", 32: "NV", 33: "NH", 34: "NJ", 35: "NM", 36: "NY", 37: "NC", 38: "ND", 39: "OH", 40: "OK", 41: "OR", 42: "PA", 44: "RI", 45: "SC", 46: "SD", 47: "TN", 48: "TX", 49: "UT", 50: "VT", 51: "VA", 53: "WA", 54: "WV", 55: "WI", 56: "WY", 72: "PR" };

/** Each file once, kept under raw/geo/. Returns what could not be fetched; the site works without them. */
export function saveZipFiles() {
  mkdirSync(at("raw", "geo"), { recursive: true });
  const failed = [];
  for (const [name, url] of Object.entries(FILES)) {
    if (existsSync(at("raw", "geo", name))) continue;
    const r = spawnSync("python3", ["-c", FETCH, url, at("raw", "geo", name)], { encoding: "utf8" });
    if (r.status !== 0) failed.push(`${name}: ${(r.stderr || "").trim().split("\n").pop()}`);
  }
  return failed;
}

export const zipFilesSaved = () => Object.keys(FILES).every((n) => existsSync(at("raw", "geo", n)));

/** "Round Rock city" and "Round Rock" are one place to a person. */
const placeName = (s) => s.replace(/\s+(city|town|village|borough|CDP|municipality|consolidated government|unified government|metro government)(\s*\(.*\))?$/i, "").trim().toLowerCase();
export const placeKey = (name, state) => `${String(state).toLowerCase()}|${placeName(String(name))}`;

function read(file, zipAt, idAt, nameAt, partAt, zipLandAt, landAt) {
  if (!existsSync(file)) return [];
  const rows = [];
  for (const line of readFileSync(file, "utf8").replace(/^﻿/, "").split("\n").slice(1)) {
    const f = line.split("|");
    if (!f[zipAt] || !f[idAt]) continue;
    const part = Number(f[partAt]);
    if (part / Number(f[zipLandAt]) < SHARE && part / Number(f[landAt]) < SHARE) continue;
    const state = FIPS[f[idAt].slice(0, 2)];
    if (state) rows.push({ zip: f[zipAt], state, name: f[nameAt], kind: "", key: placeKey(f[nameAt], state), share: part / Number(f[zipLandAt]) });
  }
  return rows;
}

/** Every ZIP with the cities and counties it belongs to, both ways. */
export function loadZipMap() {
  const geo = (n) => at("raw", "geo", n);
  const places = read(geo("zip-place.txt"), 1, 9, 10, 16, 3, 11).map((r) => ({ ...r, kind: "city" }));
  const counties = read(geo("zip-county.txt"), 1, 9, 10, 16, 3, 11).map((r) => ({ ...r, kind: "county" }));
  const byPlace = new Map();
  const byZip = new Map();
  for (const r of [...places, ...counties]) {
    byPlace.set(r.key, [...(byPlace.get(r.key) ?? []), r.zip]);
    byZip.set(r.zip, [...(byZip.get(r.zip) ?? []), r]);
  }
  for (const list of byZip.values()) list.sort((x, y) => (x.kind === y.kind ? y.share - x.share : x.kind === "city" ? -1 : 1));
  return {
    zipsOf: (name, state) => [...new Set(byPlace.get(placeKey(name, state)) ?? [])].sort(),
    placesOf: (zip) => byZip.get(zip) ?? [],
  };
}

/** Each ZIP's center: [zip, lat, lng]. */
export function zipCenters() {
  const file = at("raw", "geo", "zcta.txt");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .slice(1)
    .map((l) => l.trim().split(/\s+/))
    .map((f) => [f[0], Number(f[f.length - 2]), Number(f[f.length - 1])])
    .filter(([z]) => /^\d{5}$/.test(z));
}
