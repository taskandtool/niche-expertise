// ZIP codes and places, from the Census's own shape of file: a real overlap counts, a touch doesn't.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { company, csv, folder } from "./fixture.mjs";

const HEAD = "﻿OID|GEOID_ZCTA|NAME_ZCTA|AREALAND_ZCTA|AW|M|C|F|OID_P|GEOID_P|NAME_P|AREALAND_P|AW|M|C|F|PART|AWP\n";
const row = (zip, zipLand, id, name, land, part) => `1|${zip}|ZCTA5 ${zip}|${zipLand}|0|G|B|S|2|${id}|${name}|${land}|0|G|C|A|${part}|0\n`;

function census(f) {
  f.put("raw/geo/zip-place.txt", HEAD + row("78664", 43000000, "4863500", "Round Rock city", 97000000, 30000000) + row("78626", 229000000, "4863500", "Round Rock city", 97000000, 900000) + row("78664", 43000000, "4823000", "Far Town", 900000000, 2000000));
  f.put("raw/geo/zip-county.txt", HEAD + row("78664", 43000000, "48491", "Williamson County", 2900000000, 43000000));
  f.put("raw/geo/zcta.txt", "GEOID ALAND AWATER ALAND_SQMI AWATER_SQMI INTPTLAT INTPTLONG\n78664 1 2 3 4 30.50 -97.60\n78626 1 2 3 4 30.70 -97.60\n");
}

test("a city's ZIPs leave out one that only touches it, and a ZIP names its city first", async () => {
  const f = folder();
  census(f);
  const city = await f.run("zips.mjs", ["city", "Round Rock", "--state", "TX", "--json"]);
  assert.equal(city.status, 0, city.stderr);
  assert.deepEqual(JSON.parse(city.stdout).zips, ["78664"]);
  const zip = await f.run("zips.mjs", ["zip", "78664", "--json"]);
  const places = JSON.parse(zip.stdout).places;
  assert.equal(places[0].name, "Round Rock city");
  assert.equal(places[0].state, "TX");
  assert.ok(places.some((p) => p.kind === "county" && p.name === "Williamson County"));
  assert.ok(!places.some((p) => p.name === "Far Town"), "under a tenth of both");
});

test("a place with no ZIPs says so and how to go on; bad input is misuse", async () => {
  const f = folder();
  census(f);
  const none = await f.run("zips.mjs", ["city", "Nowhere", "--state", "TX"]);
  assert.equal(none.status, 1);
  assert.match(none.stderr, /no ZIP codes for Nowhere, TX/);
  assert.equal((await f.run("zips.mjs", ["zip", "12"])).status, 2);
  assert.equal((await f.run("zips.mjs", ["city", "Round Rock"])).status, 2);
});

test("offers come first, then names; a company's address gives it a ZIP page", async () => {
  const f = folder();
  census(f);
  f.put("companies.csv", csv(
    { slug: "acme", name: "Acme", website: "https://acme.example", domain: "acme.example", state: "done", locations: [{ address: "1 Main", city: "Round Rock", region: "TX", postcode: "78664", lat: 30.5, lng: -97.6 }] },
    { slug: "zed", name: "Zed Air", website: "https://zed.example", domain: "zed.example", state: "done" },
  ));
  company(f, "acme", "We fix things.");
  company(f, "zed", "$500 off a new system.");
  f.put("records/acme.md", "---\nname: Acme\n---\n");
  f.put("records/zed.md", '---\nname: Zed Air\noffers:\n  - { kind: discount, title: "$500 off", source: site, quote: "$500 off a new system", url: "https://zed.example/" }\n---\n');
  assert.equal((await f.run("build-data.mjs", ["--today", "2026-06-15"])).status, 0);
  const data = (n) => JSON.parse(readFileSync(join(f.dir, "data", `${n}.json`), "utf8"));
  assert.deepEqual(data("companies").map((c) => c.slug), ["zed", "acme"]);
  assert.deepEqual(data("companies")[1].zips, ["78664"]);
  const page = data("zip-pages").find((z) => z.zip === "78664");
  assert.deepEqual(page.companies, ["acme"]);
  assert.equal(page.place, "Round Rock, TX");
  assert.ok(data("pages").some((p) => p.path === "/zips/78664"));
});
