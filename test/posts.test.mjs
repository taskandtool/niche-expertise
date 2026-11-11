import { test } from "node:test";
import assert from "node:assert/strict";
import { folder } from "./fixture.mjs";

const NOW = "2026-06-15";

/** A built site: one company past the labor standard, one brand with its maker's terms, one new offer. */
function built() {
  const f = folder();
  f.put("data/stats.json", { total: 2, built: NOW });
  f.put("data/companies.json", [
    { slug: "larkspur-heating", name: "Larkspur Heating", path: "/companies/larkspur-heating", ratings: [{ platform: "Google", rating: 4.9, count: 412 }], standouts: [{ kind: "longer-guarantee", guarantee: "labor", length: "10 years", standard: "1 year" }] },
    { slug: "fernway-air", name: "Fernway Air", path: "/companies/fernway-air", ratings: [], standouts: [] },
  ]);
  f.put("data/guarantees.json", [{ name: "labor", path: "/guarantees/labor", index: true, standard: "1 year" }]);
  f.put("data/brands.json", [{ name: "Northwind", path: "/brands/northwind", index: true, count: 3, adds: [{}], maker: { warranty: [{ covers: "parts", length: "10 years", condition: "if registered" }] } }]);
  f.put("data/offers.json", { live: [{ title: "$500 off a new system", firstSeen: "2026-06-10", ends: null, company: { name: "Fernway Air", path: "/companies/fernway-air" } }, { title: "Old news", firstSeen: "2026-01-01", company: { name: "Fernway Air", path: "/companies/fernway-air" } }] });
  return f;
}

test("ideas name each page and the facts to use, strongest first, recent only", async () => {
  const f = built();
  const r = await f.run("posts.mjs", ["ideas", "--today", NOW]);
  assert.equal(r.status, 0, r.stderr);
  const lines = r.stdout.split("\n");
  assert.match(lines[0], /posts ideas: 3 ideas from the last 14 days/);
  assert.match(r.stdout, /guarantee: \/guarantees\/labor\n\s+the usual labor guarantee here is 1 year; going further: Larkspur Heating \(10 years\)/);
  assert.match(r.stdout, /brand: \/brands\/northwind\n\s+Northwind gives 10 years on parts \(if registered\); 3 installers here, 1 add a guarantee of their own/);
  assert.match(r.stdout, /new offer: \/companies\/fernway-air\n\s+Fernway Air: \$500 off a new system/);
  assert.doesNotMatch(r.stdout, /Old news/);
  assert.ok(r.stdout.indexOf("guarantee:") < r.stdout.indexOf("new offer:"));
});

test("a page a filed post already covers is left out", async () => {
  const f = built();
  f.put("posts/2026-06-12-labor/post.md", "---\npage: /guarantees/labor\nplatform: facebook\nstatus: draft\n---\nCaption.\n");
  const r = await f.run("posts.mjs", ["ideas", "--today", NOW]);
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stdout, /\/guarantees\/labor/);
  assert.match(r.stdout, /2 ideas/);
});

test("a bad --today or --days is misuse, not a crash", async () => {
  const f = built();
  for (const args of [["--today", "2026-13-99"], ["--today", "soon"], ["--days", "1.5"]]) {
    const r = await f.run("posts.mjs", ["ideas", ...args]);
    assert.equal(r.status, 2, `${args.join(" ")}: ${r.stderr}`);
    assert.equal(r.stdout, "");
    assert.match(r.stderr, /Try: node scripts\/posts.mjs ideas/);
  }
});

test("ideas before data/ is built is a failure with the command that fixes it", async () => {
  const r = await folder().run("posts.mjs", ["ideas"]);
  assert.equal(r.status, 1);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /Try: node scripts\/build-data.mjs/);
});
